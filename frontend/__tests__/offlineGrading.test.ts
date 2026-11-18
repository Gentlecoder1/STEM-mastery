import { sha256Hex } from '../src/lib/sha256';
import {
  answerHash,
  keywordStems,
  markOffline,
  summariseOffline,
} from '../src/lib/offlineGrading';
import type { QuizQuestion } from '../src/types/catalog';

describe('sha256Hex', () => {
  it('matches the FIPS test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('hashes UTF-8 like Python hashlib', () => {
    // python: hashlib.sha256("q1:10⁻⁶ m/s²".encode()).hexdigest()
    expect(sha256Hex('q1:10⁻⁶ m/s²')).toHaveLength(64);
  });
});

describe('keywordStems', () => {
  it('follows the backend rules (see backend tests)', () => {
    expect(keywordStems('The forces acting on a body: Forces, mass and acceleration')).toEqual([
      'force',
      'acting',
      'body',
      'mass',
      'acceleration',
    ]);
  });
});

const mcq: QuizQuestion = {
  id: 'q-velocity-1',
  type: 'mcq',
  prompt: 'What is velocity?',
  options: [
    { id: 'a', label: 'A', text: 'Distance' },
    { id: 'b', label: 'B', text: 'Speed in a given direction' },
  ],
  offlineKey: { v: 1, answerHash: answerHash('q-velocity-1', 'b') },
};

const written: QuizQuestion = {
  id: 'q-velocity-3',
  type: 'written',
  prompt: 'Describe velocity.',
  offlineKey: {
    v: 1,
    keywordHashes: [answerHash('q-velocity-3', 'velocity'), answerHash('q-velocity-3', 'vector')],
    minCoverage: 0.5,
  },
};

describe('markOffline', () => {
  it('uses the same hash as the backend test fixture', () => {
    // backend/tests/test_catalog.py: sha256("q-velocity-1:b")
    expect(mcq.offlineKey?.answerHash).toBe(sha256Hex('q-velocity-1:b'));
  });

  it('marks multiple choice from the hashed key', () => {
    expect(markOffline(mcq, 'b').correct).toBe(true);
    expect(markOffline(mcq, 'B').correct).toBe(true);
    expect(markOffline(mcq, 'a').correct).toBe(false);
  });

  it('gives keyword coverage for written answers and scores them against the threshold', () => {
    const mark = markOffline(written, 'Velocity is a vector quantity');
    expect(mark.correct).toBe(true);
    expect(mark.coverage).toBe(1);
    expect(markOffline(written, 'It is how fast you go').coverage).toBe(0);
  });

  it('leaves questions without a cached key unmarked', () => {
    expect(markOffline({ ...mcq, offlineKey: null }, 'b').correct).toBeNull();
  });
});

describe('summariseOffline', () => {
  it('mirrors server scoring for choice and written questions', () => {
    const marks = [markOffline(mcq, 'b'), markOffline(written, 'velocity')];
    expect(summariseOffline([mcq, written], marks)).toEqual({
      correct: 2,
      total: 2,
      scorePct: 100,
      passed: true,
      unmarked: 0,
    });
  });
});
