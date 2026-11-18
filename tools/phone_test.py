#!/usr/bin/env python3
"""STEM Mastery phone test (thesis Objective 3/4): one command for memory, latency, energy and storage.

Needs: Python 3.8+, Android platform-tools (`adb` on PATH), an Android phone with USB debugging on,
and the benchmark APK (eas build -p android --profile benchmark), installed and signed in, with a few
chapters downloaded inside the app (Download for offline) before the test.

Usage:
  python tools/phone_test.py                     # full run (~70 min: 2 x 30-min energy runs)
  python tools/phone_test.py --energy-minutes 10 # shorter energy runs
  python tools/phone_test.py --skip-energy       # memory + latency + storage only (~5 min)
  python tools/phone_test.py --apk app.apk       # install the APK first

Results: phone_test_results/<date>/results.json and summary.txt (copy the summary into Chapter 4).
"""
import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import time
import uuid

PKG = 'com.anonymous.stemmastery'
TAG = 'STEM_BENCH'


def adb(*args, check=True, timeout=120):
    r = subprocess.run(['adb', *args], capture_output=True, text=True, timeout=timeout)
    if check and r.returncode != 0:
        sys.exit(f'adb {" ".join(args)} failed: {r.stderr.strip()}')
    return r.stdout


def sh(cmd, **kw):
    return adb('shell', cmd, **kw)


def step(msg):
    print(f'\n=== {msg}')


def pause(msg):
    input(f'>>> {msg} Press Enter when ready... ')


def device_info():
    model = sh('getprop ro.product.model').strip()
    android = sh('getprop ro.build.version.release').strip()
    ram_kb = int(re.search(r'MemTotal:\s+(\d+)', sh('cat /proc/meminfo')).group(1))
    return {'model': model, 'android': android, 'ram_gb': round(ram_kb / 1024 / 1024, 1)}


def pss_mb():
    out = sh(f'dumpsys meminfo {PKG}')
    m = re.search(r'TOTAL PSS:\s+(\d+)', out) or re.search(r'^\s*TOTAL\s+(\d+)', out, re.M)
    return round(int(m.group(1)) / 1024, 1) if m else None


def memory(points=('idle', 'lesson_open', 'quiz_running'), repeats=3):
    res = {}
    for p in points:
        if p == 'idle':
            time.sleep(15)
        elif p == 'lesson_open':
            pause('On the phone, open any lesson and scroll it.')
        else:
            pause('On the phone, start a concept quiz and answer one question.')
        vals = []
        for _ in range(repeats):
            vals.append(pss_mb()); time.sleep(3)
        valid = [value for value in vals if value is not None]
        res[p] = {'pss_mib': vals, 'mean_mib': round(sum(valid) / len(valid), 1) if valid else None}
        print(f'  {p}: {vals} MB')
    return res


def open_benchmark(query, wait_s):
    run_id = uuid.uuid4().hex
    output = sh(
        f'am start -W -a android.intent.action.VIEW '
        f'-d "stemmastery://benchmark?{query}&runId={run_id}" -p {PKG}'
    )
    if 'Error:' in output or 'Exception' in output:
        return {'error': output.strip()}
    deadline = time.monotonic() + wait_s
    while time.monotonic() < deadline:
        time.sleep(3)
        log = adb('logcat', '-d', '-s', 'ReactNativeJS:V', check=False)
        for line in reversed(log.splitlines()):
            if TAG not in line or run_id not in line:
                continue
            try:
                start = line.index('{', line.index(TAG))
                result, _ = json.JSONDecoder().raw_decode(line[start:])
            except ValueError:
                continue
            if result.get('run_id') == run_id:
                return result
    return {'error': f'No result in {wait_s}s. Verify the benchmark APK is open and signed in.'}


def app_uid():
    m = re.search(r'userId=(\d+)', sh(f'dumpsys package {PKG}'))
    return int(m.group(1)) if m else None


def app_mah(uid):
    out = sh(f'dumpsys batterystats {PKG}', timeout=300)
    short = f'u0a{uid - 10000}' if uid and uid >= 10000 else str(uid)
    for line in out.splitlines():
        if re.search(rf'\b(UID|Uid)\s+{short}\s*:', line):
            m = re.search(rf'{short}\s*:\s*([\d.]+)', line)
            if m:
                return float(m.group(1))
    return None


def energy(minutes, source):
    """Collect Android's estimated app consumption during a sustained workload."""
    reset = sh('dumpsys batterystats --reset')
    if 'reset' not in reset.lower() or 'permission denial' in reset.lower():
        return {'source': source, 'minutes': minutes, 'error': 'Could not reset Android battery accounting.'}
    try:
        sh('dumpsys battery unplug')
        out = open_benchmark(
            f'mode=load&minutes={minutes}&source={source}&offline={int(source == "local")}',
            minutes * 60 + 180,
        )
        valid = out.get('cycles', 0) > 0 and not out.get('errors') and not out.get('error')
        return {
            'source': source, 'minutes': minutes,
            'estimated_app_mah': app_mah(app_uid()) if valid else None,
            'workload': out,
        }
    finally:
        sh('dumpsys battery reset', check=False)


def storage():
    out = sh('dumpsys diskstats')
    names = re.search(r'Package Names: \[(.*?)\]', out)
    sizes = {k: re.search(rf'{k}: \[(.*?)\]', out) for k in ('App Sizes', 'App Data Sizes', 'Cache Sizes')}
    if not names or not all(sizes.values()):
        return {'note': 'diskstats not available; read Settings > Apps > STEM Mastery > Storage'}
    pkgs = [p.strip('" ') for p in names.group(1).split(',')]
    if PKG not in pkgs:
        return {'note': 'package not in diskstats yet; read Settings > Apps > STEM Mastery > Storage'}
    i = pkgs.index(PKG)
    try:
        values = {key: round(int(match.group(1).split(',')[i]) / 2**20, 2) for key, match in sizes.items()}
    except (IndexError, ValueError):
        return {'note': 'Could not parse diskstats; read Settings > Apps > STEM Mastery > Storage'}
    return {'app_mib': values['App Sizes'], 'data_mib': values['App Data Sizes'], 'cache_mib': values['Cache Sizes']}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apk'); ap.add_argument('--energy-minutes', type=int, default=30)
    ap.add_argument('--skip-energy', action='store_true')
    a = ap.parse_args()

    if a.energy_minutes < 1:
        ap.error('--energy-minutes must be at least 1')
    if not shutil.which('adb'):
        sys.exit('ADB is missing. Install Android SDK Platform-Tools and add its folder to PATH.')
    devices = [line for line in adb('devices').splitlines()[1:] if line.split()[-1:] == ['device']]
    if len(devices) != 1:
        sys.exit('Connect one Android phone by USB, enable USB debugging and accept the authorization prompt. Disconnect other devices or emulators.')
    if a.apk:
        step('Installing APK')
        adb('install', '-r', a.apk, timeout=600)
    if 'package:' not in sh(f'pm path {PKG}', check=False):
        sys.exit('Install the benchmark APK first, or pass its path with --apk.')

    out_dir = os.path.join('phone_test_results', datetime.datetime.now().strftime('%Y-%m-%d_%H%M%S'))
    os.makedirs(out_dir)
    res = {'device': device_info(), 'package': PKG}

    def save():
        with open(os.path.join(out_dir, 'results.json'), 'w', encoding='utf-8') as output:
            json.dump(res, output, indent=2)
        lines = [f"Device: {res['device']}", f"Storage (MiB): {res.get('storage', 'Pending')}"]
        for name, item in res.get('memory', {}).items():
            lines.append(f"Memory {name} (mean PSS, MiB): {item['mean_mib']}")
        for key in ('latency_online', 'latency_offline'):
            result = res.get(key, {})
            if result.get('error'):
                lines.append(f"{key}: {result['error']}")
            elif result:
                lines.append(
                    f"{key}: local {result.get('QL_local_ms')} ms, "
                    f"cloud {result.get('QL_cloud_ms')} ms, latency reduction {result.get('LR_percent')}%"
                )
        offline = res.get('latency_offline', {})
        if offline.get('mode') == 'latency':
            marks = offline.get('offline_marking_per_answer')
            lines.append(f'Offline MCQ marking per answer: {marks}' if marks else
                         'Offline MCQ marking: no cached questions with answer keys. Redownload topics after backend deployment.')
        for key in ('energy_offline', 'energy_online'):
            if key in res:
                lines.append(f"{key} (Android estimate): {res[key]}")
        with open(os.path.join(out_dir, 'summary.txt'), 'w', encoding='utf-8') as output:
            output.write('\n'.join(lines) + '\n')

    timeout = sh('settings get system screen_off_timeout').strip()
    save()
    try:
        sh('settings put system screen_off_timeout 3600000')
        if not a.skip_energy:
            print('Energy runs reset Android battery-usage statistics and report an estimate.')
        pause('Connect to the internet. Open STEM Mastery, sign in, download at least 3 topics, and leave the app on Home.')
        step('Storage')
        res['storage'] = storage()
        save()
        step('Memory (total PSS)')
        res['memory'] = memory()
        save()
        step('Online latency')
        res['latency_online'] = open_benchmark('mode=latency&offline=0', 600)
        save()
        step('Offline latency')
        pause('Turn on airplane mode and confirm Wi-Fi is off. Keep the USB cable connected and leave the app open.')
        res['latency_offline'] = open_benchmark('mode=latency&offline=1', 300)
        save()
        if not a.skip_energy:
            step(f'Offline workload ({a.energy_minutes} minutes)')
            res['energy_offline'] = energy(a.energy_minutes, 'local')
            save()
            pause('Turn off airplane mode and reconnect to the same internet connection used for online latency.')
            step(f'Online workload ({a.energy_minutes} minutes)')
            res['energy_online'] = energy(a.energy_minutes, 'cloud')
            save()
    finally:
        restore = (
            f'settings put system screen_off_timeout {timeout}' if timeout.isdigit()
            else 'settings delete system screen_off_timeout'
        )
        sh(restore, check=False)
        print(f'\nResults saved in {out_dir}. Restore your usual Wi-Fi and airplane-mode settings.')


if __name__ == '__main__':
    main()
