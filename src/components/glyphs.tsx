import Svg, { Circle, Line, Path, Polygon, Rect, type SvgProps } from 'react-native-svg';
import { colors } from '../theme';

export type GlyphProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: SvgProps['style'];
};


export const ATOMICON_PATH =
  'M10.292 9.49994C10.292 9.93716 9.93753 10.2916 9.50031 10.2916C9.06308 10.2916 8.70864 9.93716 8.70864 9.49994C8.70864 9.06271 9.06308 8.70827 9.50031 8.70827C9.93753 8.70827 10.292 9.06271 10.292 9.49994ZM15.9919 15.9919C17.6069 14.3848 16.0077 10.1652 12.4294 6.57106C8.83522 2.99273 4.61563 1.39356 3.00855 3.00856C1.39355 4.61565 2.99272 8.83523 6.57105 12.4294C10.1652 16.0077 14.3848 17.6069 15.9919 15.9919ZM12.4294 12.4294C16.0077 8.83523 17.6069 4.61565 15.9919 3.00856C14.3848 1.39356 10.1652 2.99273 6.57105 6.57106C2.99272 10.1652 1.39355 14.3848 3.00855 15.9919C4.61563 17.6069 8.83522 16.0077 12.4294 12.4294Z';

export function AtomIcon({ size = 19, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Path
        d={ATOMICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const BOOKOPENICON_PATH =
  'M10 5.83333V17.5M10 5.83333C10 4.94928 9.6488 4.10143 9.02363 3.47631C8.39846 2.85119 7.55054 2.5 6.66642 2.5H2.49942C2.27838 2.5 2.06641 2.5878 1.91011 2.74408C1.75382 2.90036 1.66602 3.11232 1.66602 3.33333V14.1667C1.66602 14.3877 1.75382 14.5996 1.91011 14.7559C2.06641 14.9122 2.27838 15 2.49942 15H7.49982C8.16291 15 8.79885 15.2634 9.26772 15.7322C9.7366 16.2011 10 16.837 10 17.5M10 5.83333C10 4.94928 10.3512 4.10143 10.9764 3.47631C11.6016 2.85119 12.4495 2.5 13.3336 2.5H17.5006C17.7216 2.5 17.9336 2.5878 18.0899 2.74408C18.2462 2.90036 18.334 3.11232 18.334 3.33333V14.1667C18.334 14.3877 18.2462 14.5996 18.0899 14.7559C17.9336 14.9122 17.7216 15 17.5006 15H12.5002C11.8371 15 11.2012 15.2634 10.7323 15.7322C10.2634 16.2011 10 16.837 10 17.5';

export function BookOpenIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={BOOKOPENICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const CALENDARICON_PATH =
  'M8 1.9992V5.99952M16 1.9992V5.99952M3 9.99984H21M8 14.0002H8.01M12 14.0002H12.01M16 14.0002H16.01M8 18.0005H8.01M12 18.0005H12.01M16 18.0005H16.01M5 3.99936H19C20.1046 3.99936 21 4.89486 21 5.99952V20.0006C21 21.1053 20.1046 22.0008 19 22.0008H5C3.89543 22.0008 3 21.1053 3 20.0006V5.99952C3 4.89486 3.89543 3.99936 5 3.99936Z';

export function CalendarIcon({ size = 24, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d={CALENDARICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const CHARTICON_PATH =
  'M4.16602 17.5V12.5M10 17.5V7.5M15.834 17.5V2.5';

export function ChartIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={CHARTICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const USERICON_PATH =
  'M15.0004 16.6672C15.0004 15.341 14.4736 14.0691 13.5358 13.1314C12.5981 12.1936 11.3262 11.6668 10 11.6668M10 11.6668C8.67383 11.6668 7.40196 12.1936 6.4642 13.1314C5.52644 14.0691 4.99962 15.341 4.99962 16.6672M10 11.6668C11.8411 11.6668 13.3336 10.1743 13.3336 8.33318C13.3336 6.49209 11.8411 4.99958 10 4.99958C8.15892 4.99958 6.66642 6.49209 6.66642 8.33318C6.66642 10.1743 8.15892 11.6668 10 11.6668ZM18.334 9.99998C18.334 14.6027 14.6028 18.334 10 18.334C5.39727 18.334 1.66602 14.6027 1.66602 9.99998C1.66602 5.39724 5.39727 1.66599 10 1.66599C14.6028 1.66599 18.334 5.39724 18.334 9.99998Z';

export function UserIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={USERICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const DUMBBELLICON_PATH =
  'M2.08401 17.9155L3.25059 16.749M16.7497 3.25059L17.9163 2.08403M8.00034 11.9994L12 7.99981M14.663 10.6397C14.9756 10.9523 15.3996 11.1279 15.8417 11.1279C16.2838 11.1279 16.7078 10.9523 17.0204 10.6397C17.333 10.3271 17.5086 9.90312 17.5086 9.46104C17.5086 9.01897 17.333 8.595 17.0204 8.28241L15.5471 6.81005C15.8597 7.12253 16.2837 7.29804 16.7257 7.29796C16.9445 7.29792 17.1612 7.25478 17.3634 7.17099C17.5656 7.0872 17.7493 6.96441 17.904 6.80963C18.0588 6.65485 18.1815 6.47111 18.2652 6.2689C18.3489 6.06669 18.392 5.84997 18.392 5.63111C18.3919 5.41226 18.3488 5.19556 18.265 4.99338C18.1812 4.7912 18.0584 4.6075 17.9036 4.45277L15.5471 2.09633C15.2346 1.78374 14.8108 1.60808 14.3688 1.608C13.9268 1.60792 13.5028 1.78343 13.1902 2.09591C12.8776 2.4084 12.702 2.83226 12.7019 3.27426C12.7018 3.71625 12.8773 4.14018 13.1898 4.45277L11.7174 2.97958C11.5626 2.8248 11.3789 2.70202 11.1766 2.61825C10.9744 2.53449 10.7576 2.49137 10.5387 2.49137C10.3198 2.49137 10.1031 2.53449 9.90085 2.61825C9.69862 2.70202 9.51486 2.8248 9.36008 2.97958C9.20529 3.13436 9.08251 3.31811 8.99874 3.52034C8.91497 3.72257 8.87186 3.93932 8.87186 4.15822C8.87186 4.37711 8.91497 4.59386 8.99874 4.79609C9.08251 4.99832 9.20529 5.18207 9.36008 5.33685L14.663 10.6397ZM4.45281 17.9037C4.7653 18.2163 5.18917 18.3919 5.63118 18.392C5.85004 18.392 6.06677 18.349 6.26898 18.2653C6.4712 18.1815 6.65494 18.0588 6.80973 17.9041C6.96451 17.7494 7.0873 17.5657 7.17109 17.3635C7.25488 17.1613 7.29803 16.9446 7.29807 16.7257C7.29811 16.5069 7.25504 16.2902 7.17132 16.088C7.0876 15.8858 6.96487 15.702 6.81014 15.5472L8.28254 17.0204C8.59514 17.333 9.01912 17.5086 9.4612 17.5086C9.90329 17.5086 10.3273 17.333 10.6399 17.0204C10.9525 16.7078 11.1281 16.2839 11.1281 15.8418C11.1281 15.3997 10.9525 14.9757 10.6399 14.6632L5.33691 9.36032C5.18213 9.20554 4.99837 9.08276 4.79614 8.999C4.5939 8.91523 4.37715 8.87212 4.15825 8.87212C3.93935 8.87212 3.7226 8.91523 3.52036 8.999C3.31812 9.08276 3.13437 9.20554 2.97958 9.36032C2.8248 9.51511 2.70202 9.69886 2.61825 9.90109C2.53448 10.1033 2.49136 10.3201 2.49136 10.539C2.49136 10.7579 2.53448 10.9746 2.61825 11.1768C2.70202 11.3791 2.8248 11.5628 2.97958 11.7176L4.45281 13.19C4.14021 12.8775 3.71627 12.702 3.27427 12.702C2.83226 12.7021 2.40839 12.8778 2.0959 13.1904C1.7834 13.503 1.60789 13.9269 1.60797 14.3689C1.60805 14.8109 1.78371 15.2347 2.09631 15.5472L4.45281 17.9037Z';

export function DumbbellIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={DUMBBELLICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const FLAMEICON_PATH =
  'M12.0003 7.12521C10.5002 5.87515 9.50005 4.25008 8.99999 2.25C7.74985 3.25004 7.12478 4.25008 7.12478 5.25013C7.12478 6.75019 8.2499 7.50022 8.2499 9.00028C8.2499 9.49759 8.05234 9.97452 7.70067 10.3262C7.349 10.6778 6.87203 10.8754 6.37469 10.8754C5.87735 10.8754 5.40038 10.6778 5.04871 10.3262C4.69704 9.97452 4.49948 9.49759 4.49948 9.00028C4.01259 9.64942 3.74939 10.439 3.74939 11.2504C3.74939 12.6428 4.30258 13.9782 5.28725 14.9628C6.27193 15.9475 7.60744 16.5006 8.99999 16.5006C10.3925 16.5006 11.728 15.9475 12.7127 14.9628C13.6974 13.9782 14.2506 12.6428 14.2506 11.2504C14.2506 9.75032 13.5005 8.37526 12.0003 7.12521Z';

export function FlameIcon({ size = 18, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path
        d={FLAMEICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const FLASKICON_PATH =
  'M11.0843 1.5827V6.33308C11.0842 6.5987 11.1509 6.86007 11.2782 7.09314L15.6403 15.0738C15.7722 15.315 15.8391 15.5863 15.8344 15.8612C15.8296 16.136 15.7534 16.4049 15.6132 16.6414C15.473 16.8779 15.2737 17.0738 15.0348 17.2098C14.796 17.3459 14.5258 17.4174 14.2509 17.4173H4.75098C4.4761 17.4174 4.20594 17.3459 3.96707 17.2098C3.72821 17.0738 3.52888 16.8779 3.38869 16.6414C3.2485 16.4049 3.17228 16.136 3.16753 15.8612C3.16279 15.5863 3.22968 15.315 3.36162 15.0738L7.72367 7.09314C7.85104 6.86007 7.91774 6.5987 7.91763 6.33308V1.5827M5.10934 11.8752H13.892M6.72977 1.5827H12.2714';

export function FlaskIcon({ size = 19, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Path
        d={FLASKICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const GAUGEICON_PATH =
  'M13.5 15.7506L18.0003 11.2507M3.7567 21.3759C2.76912 19.6657 2.24916 17.7258 2.24908 15.751C2.24901 13.7762 2.76882 11.8362 3.75628 10.126C4.74373 8.41575 6.16403 6.99555 7.87441 6.00814C9.58479 5.02073 11.525 4.5009 13.5 4.5009C15.475 4.5009 17.4152 5.02073 19.1256 6.00814C20.8359 6.99555 22.2562 8.41575 23.2437 10.126C24.2311 11.8362 24.751 13.7762 24.7509 15.751C24.7508 17.7258 24.2308 19.6657 23.2433 21.3759';

export function GaugeIcon({ size = 27, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 27 27" fill="none" style={style}>
      <Path
        d={GAUGEICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const HOUSEICON_PATH =
  'M12.5 17.4993V10.8327C12.5 10.6116 12.4122 10.3997 12.2559 10.2434C12.0996 10.0871 11.8877 9.99932 11.6667 9.99932H8.33333C8.11232 9.99932 7.90036 10.0871 7.74408 10.2434C7.5878 10.3997 7.5 10.6116 7.5 10.8327V17.4993M2.5 8.33305C2.49994 8.09061 2.55278 7.85107 2.65482 7.63115C2.75687 7.41123 2.90566 7.21622 3.09083 7.05972L8.92417 2.05972C9.22499 1.80548 9.60613 1.66599 10 1.66599C10.3939 1.66599 10.775 1.80548 11.0758 2.05972L16.9092 7.05972C17.0943 7.21622 17.2431 7.41123 17.3452 7.63115C17.4472 7.85107 17.5001 8.09061 17.5 8.33305V15.8331C17.5 16.2751 17.3244 16.699 17.0118 17.0116C16.6993 17.3241 16.2754 17.4997 15.8333 17.4997H4.16667C3.72464 17.4997 3.30072 17.3241 2.98816 17.0116C2.67559 16.699 2.5 16.2751 2.5 15.8331V8.33305Z';

export function HouseIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={HOUSEICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const MEDALICON_PATH =
  'M7.81221 16.2503L2.88339 7.73458C2.67086 7.36716 2.5709 6.94541 2.59594 6.52167C2.62097 6.09793 2.76989 5.69088 3.02421 5.35106L4.76826 3.03254C4.97006 2.76342 5.23174 2.545 5.53257 2.39456C5.83341 2.24412 6.16513 2.1658 6.50147 2.1658H19.5006C19.8369 2.1658 20.1686 2.24412 20.4694 2.39456C20.7703 2.545 21.032 2.76342 21.2338 3.03254L22.967 5.35106C23.223 5.68979 23.3738 6.09628 23.4008 6.52003C23.4278 6.94379 23.3296 7.36613 23.1186 7.73458L18.1898 16.2503M11.9174 13.0002L5.54785 2.3827M14.0838 13.0002L20.4533 2.3827M8.6675 7.5829H17.3336M13.0005 19.5005V17.3337H12.4589M18.4168 18.4171C18.4168 21.4089 15.9919 23.8342 13.0005 23.8342C10.0092 23.8342 7.58424 21.4089 7.58424 18.4171C7.58424 15.4253 10.0092 13 13.0005 13C15.9919 13 18.4168 15.4253 18.4168 18.4171Z';

export function MedalIcon({ size = 26, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none" style={style}>
      <Path
        d={MEDALICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const SEARCHICON_PATH =
  'M17.5001 17.5001L13.8835 13.8835M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z';

export function SearchIcon({ size = 20, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d={SEARCHICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const SIGMAICON_PATH =
  'M14.25 5.54206V3.95888C14.25 3.74894 14.1666 3.5476 14.0181 3.39915C13.8697 3.2507 13.6683 3.1673 13.4583 3.1673H5.14583C5.07232 3.1673 5.00026 3.18777 4.93773 3.22641C4.8752 3.26505 4.82466 3.32034 4.79179 3.38609C4.75891 3.45183 4.745 3.52543 4.7516 3.59864C4.7582 3.67184 4.78506 3.74176 4.82917 3.80057L8.39167 8.55009C8.59722 8.82413 8.70833 9.15745 8.70833 9.5C8.70833 9.84255 8.59722 10.1759 8.39167 10.4499L4.82917 15.1994C4.78506 15.2582 4.7582 15.3282 4.7516 15.4014C4.745 15.4746 4.75891 15.5482 4.79179 15.6139C4.82466 15.6797 4.8752 15.7349 4.93773 15.7736C5.00026 15.8122 5.07232 15.8327 5.14583 15.8327H13.4583C13.6683 15.8327 13.8697 15.7493 14.0181 15.6008C14.1666 15.4524 14.25 15.2511 14.25 15.0411V13.4579';

export function SigmaIcon({ size = 19, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Path
        d={SIGMAICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const STARICON_PATH =
  'M8.79108 1.55919C8.72813 1.59827 8.67736 1.65417 8.64449 1.72058L6.91274 5.22983C6.79852 5.46103 6.62982 5.66101 6.42118 5.81257C6.21253 5.96412 5.97018 6.0627 5.71499 6.09982L1.84124 6.66608C1.76752 6.6765 1.6982 6.70742 1.6412 6.75531C1.58419 6.80321 1.54178 6.86615 1.5188 6.93697C1.49582 7.00779 1.49319 7.08364 1.51121 7.15588C1.52923 7.22812 1.56718 7.29385 1.62074 7.34558L4.42274 10.0733C4.6077 10.2534 4.74606 10.4758 4.82589 10.7214C4.90573 10.9669 4.92464 11.2281 4.88099 11.4826L4.22024 15.3368C4.20738 15.4101 4.21535 15.4855 4.24323 15.5545C4.27111 15.6235 4.31779 15.6832 4.37796 15.727C4.43813 15.7707 4.50937 15.7967 4.58358 15.802C4.65779 15.8073 4.73199 15.7916 4.79774 15.7568L8.26049 13.9358C8.4887 13.816 8.7426 13.7534 9.00036 13.7534C9.25812 13.7534 9.51203 13.816 9.74024 13.9358L13.2037 15.7568C13.2695 15.7918 13.3438 15.8077 13.4181 15.8025C13.4925 15.7973 13.5639 15.7714 13.6241 15.7276C13.6844 15.6838 13.7312 15.6239 13.7591 15.5548C13.787 15.4857 13.7949 15.4102 13.782 15.3368L13.1205 11.4818C13.077 11.2275 13.096 10.9664 13.1759 10.721C13.2557 10.4757 13.394 10.2534 13.5787 10.0733L16.3807 7.34482C16.4339 7.29304 16.4714 7.22742 16.4892 7.1554C16.5069 7.08338 16.5042 7.00782 16.4813 6.93728C16.4583 6.86674 16.4161 6.80402 16.3594 6.75622C16.3026 6.70843 16.2337 6.67746 16.1602 6.66683L12.2857 6.09982C12.0308 6.06241 11.7888 5.9637 11.5805 5.81217C11.3721 5.66063 11.2036 5.4608 11.0895 5.22983L9.35699 1.72058C9.32412 1.65417 9.27335 1.59827 9.2104 1.55919C9.14745 1.52011 9.07483 1.4994 9.00074 1.4994C8.92665 1.4994 8.85403 1.52011 8.79108 1.55919Z';

export function StarIcon({ size = 18, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path
        d={STARICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const TARGETICON_PATH =
  'M8.99999 16.5006C13.1425 16.5006 16.5006 13.1425 16.5006 9C16.5006 4.85754 13.1425 1.4994 8.99999 1.4994C4.85752 1.4994 1.49939 4.85754 1.49939 9C1.49939 13.1425 4.85752 16.5006 8.99999 16.5006Z';

export function TargetIcon({ size = 18, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path
        d={TARGETICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const TROPHYICON_PATH =
  'M7.49987 10.9953V12.2149C7.49704 12.4719 7.42823 12.7238 7.30004 12.9466C7.17185 13.1693 6.98858 13.3554 6.76781 13.487C6.29913 13.8341 5.91787 14.2858 5.65434 14.8061C5.3908 15.3264 5.25225 15.901 5.24969 16.4842M10.5001 10.9953V12.2149C10.5029 12.4719 10.5718 12.7238 10.6999 12.9466C10.8281 13.1693 11.0114 13.3554 11.2322 13.487C11.7008 13.8341 12.0821 14.2858 12.3456 14.8061C12.6092 15.3264 12.7477 15.901 12.7503 16.4842M13.5003 6.74982H14.6254C15.1228 6.74982 15.5997 6.55226 15.9514 6.20061C16.303 5.84895 16.5006 5.372 16.5006 4.87467C16.5006 4.37735 16.303 3.9004 15.9514 3.54874C15.5997 3.19708 15.1228 2.99952 14.6254 2.99952H13.5003M13.5003 6.74982C13.5003 7.94339 13.0262 9.08808 12.1822 9.93206C11.3382 10.776 10.1936 11.2502 8.99999 11.2502C7.80642 11.2502 6.66174 10.776 5.81775 9.93206C4.97377 9.08808 4.49963 7.94339 4.49963 6.74982M13.5003 6.74982V2.24946C13.5003 2.05054 13.4213 1.85976 13.2807 1.71909C13.14 1.57843 12.9492 1.4994 12.7503 1.4994H5.24969C5.05076 1.4994 4.85998 1.57843 4.71932 1.71909C4.57865 1.85976 4.49963 2.05054 4.49963 2.24946V6.74982M4.49963 6.74982H3.37454C2.87722 6.74982 2.40027 6.55226 2.04861 6.20061C1.69695 5.84895 1.49939 5.372 1.49939 4.87467C1.49939 4.37735 1.69695 3.9004 2.04861 3.54874C2.40027 3.19708 2.87722 2.99952 3.37454 2.99952H4.49963M2.99951 16.5006H15.0005';

export function TrophyIcon({ size = 18, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path
        d={TROPHYICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const ZAPICON_PATH =
  'M1.87739 7.50051C1.96419 7.55501 2.06468 7.58375 2.16717 7.5834H5.95841C6.04602 7.58312 6.13239 7.60409 6.21011 7.64453C6.28783 7.68496 6.35459 7.74365 6.40465 7.81556C6.45471 7.88747 6.48658 7.97045 6.49753 8.05738C6.50848 8.14432 6.49818 8.23262 6.46752 8.3147L5.42764 11.5757C5.41135 11.635 5.41568 11.698 5.43991 11.7544C5.46415 11.8109 5.50686 11.8574 5.56102 11.8864C5.61518 11.9154 5.67759 11.9251 5.73799 11.9139C5.79839 11.9027 5.8532 11.8713 5.89342 11.8249L11.2553 6.29958C11.3199 6.21997 11.3605 6.12367 11.3726 6.02187C11.3846 5.92007 11.3675 5.81694 11.3233 5.72448C11.279 5.63201 11.2095 5.554 11.1226 5.4995C11.0358 5.445 10.9354 5.41626 10.8329 5.41661H7.04162C6.95402 5.41689 6.86765 5.39592 6.78993 5.35548C6.7122 5.31505 6.64545 5.25636 6.59539 5.18445C6.54533 5.11254 6.51346 5.02956 6.5025 4.94262C6.49155 4.85569 6.50185 4.76739 6.53252 4.68531L7.5724 1.42429C7.58869 1.36505 7.58436 1.30203 7.56012 1.24558C7.53589 1.18913 7.49318 1.1426 7.43902 1.11362C7.38485 1.08465 7.32245 1.07495 7.26205 1.08612C7.20165 1.09729 7.14684 1.12867 7.10662 1.1751L1.74472 6.70043C1.68015 6.78004 1.63949 6.87634 1.62746 6.97814C1.61543 7.07994 1.63253 7.18306 1.67677 7.27553C1.72101 7.368 1.79058 7.44601 1.87739 7.50051Z';

export function ZapIcon({ size = 13, color = colors.ink, strokeWidth = 1, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={style}>
      <Path
        d={ZAPICON_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 22, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={style}>
      <Path d="M17.4173 4.58325L4.58398 17.4166M4.58398 4.58325L17.4173 17.4166" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TimerIcon({ size = 20, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Circle cx="10" cy="11.25" r="6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.25 2.25H11.75M10 11.25V7M13.8 5.83333L15.4167 4.21667" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LineChartIcon({ size = 19, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Path d="M2.37502 2.375V16.625H17.125" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.75 12.2917L8.3125 8.3125L11.0833 10.2917L15.625 4.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendingUpIcon({ size = 19, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Path d="M2.375 13.4583L7.125 8.70833L9.5 11.0833L16.625 3.95833" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.625 3.95833H11.875M16.625 3.95833V8.70833" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DivideIcon({ size = 19, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none" style={style}>
      <Circle cx="9.5" cy="4.75" r="0.75" fill={color} />
      <Line x1="4.75" y1="9.5" x2="14.25" y2="9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9.5" cy="14.25" r="0.75" fill={color} />
    </Svg>
  );
}

export function HeartIcon({ size = 18, color = colors.ink, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path
        d="M14.75 10.5C15.8667 9.40167 17 8.09 17 6.375C17 4.6475 15.6025 3.25 13.875 3.25C12.555 3.25 11.625 3.875 10.5 5C9.375 3.875 8.445 3.25 7.125 3.25C5.3975 3.25 4 4.6475 4 6.375C4 8.09 5.13333 9.40167 6.25 10.5L10.5 14.75L14.75 10.5Z"
        fill={color}
      />
    </Svg>
  );
}

export function FlagIcon({ size = 22, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={style}>
      <Path d="M4.58333 15.5833C5.5 14.8611 6.41667 14.75 8.25 14.75C10.0833 14.75 11 15.5833 12.8333 15.5833C14.6667 15.5833 16.5 14.75 16.5 14.75V3.66667C16.5 3.66667 14.6667 4.5 12.8333 4.5C11 4.5 10.0833 3.66667 8.25 3.66667C6.41667 3.66667 5.5 4.5 4.58333 4.5M4.58333 15.5833V1.83333M4.58333 15.5833V19.25" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MessageTextIcon({ size = 13, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={style}>
      <Path d="M10.2917 2.70833V7.04167C10.2917 7.1962 10.2297 7.34432 10.1192 7.4546C10.0087 7.56488 9.86033 7.625 9.70833 7.625H5.41667L3.79167 9.25V7.625H3.25C3.09765 7.625 2.94922 7.56488 2.83865 7.4546C2.72809 7.34432 2.66667 7.1962 2.66667 7.04167V2.70833C2.66667 2.5538 2.72809 2.40568 2.83865 2.2954C2.94922 2.18512 3.09765 2.125 3.25 2.125H9.70833C9.86033 2.125 10.0087 2.18512 10.1192 2.2954C10.2297 2.40568 10.2917 2.5538 10.2917 2.70833Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="4.5" y1="4.125" x2="8.5" y2="4.125" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="4.5" y1="5.875" x2="7.25" y2="5.875" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MicIcon({ size = 20, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path d="M10.0001 11.4583C10.8285 11.4583 11.5001 10.7867 11.5001 9.95833V5.625C11.5001 4.79661 10.8285 4.125 10.0001 4.125C9.17168 4.125 8.50008 4.79661 8.50008 5.625V9.95833C8.50008 10.7867 9.17168 11.4583 10.0001 11.4583Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.8334 9.25V10C15.8334 11.5478 15.2188 13.0323 14.1256 14.1256C13.0323 15.2188 11.5479 15.8334 10.0001 15.8334C8.45228 15.8334 6.96785 15.2188 5.87457 14.1256C4.78129 13.0323 4.16675 11.5478 4.16675 10V9.25M10 15.8334V18M10 18H12.3334M10 18H7.66675" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ImagePlusIcon({ size = 20, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path d="M15 5H16.6667M15.8333 3.33333V5V3.33333ZM8.75 2.5H6.66667C5.28595 2.5 4.16667 3.61929 4.16667 5V14.1667C4.16667 15.5474 5.28595 16.6667 6.66667 16.6667H15.8333C17.214 16.6667 18.3333 15.5474 18.3333 14.1667V11.25M2.5 14.5833L6.5 10.5833C7.20001 9.8833 8.13332 9.8833 8.83334 10.5833L14.1667 15.9167" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Path d="M16.5 1.5L5.25 12.75M16.5 1.5L11.25 16.5L8.25 9.75L1.5 6.75L16.5 1.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LightbulbIcon({ size = 20, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path d="M12.5 11.6667C12.6667 10.8333 13.0833 10.25 13.75 9.58333C14.5833 8.83333 15 7.66667 15 6.58333C15 4.65617 13.4272 3.08333 11.5 3.08333C9.57283 3.08333 8 4.65617 8 6.58333C8 7.41667 8.16667 8.41667 9.25 9.58333C9.83333 10.25 10.3333 10.8333 10.5 11.6667M7.5 15H12.5M8 18H12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowUpRightIcon({ size = 22, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={style}>
      <Path d="M6.41667 15.5833L15.5833 6.41667M15.5833 6.41667H8.25M15.5833 6.41667V13.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlayIcon({ size = 18, color = colors.ink, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <Polygon points="5.25 3.75 14.25 9 5.25 14.25 5.25 3.75" fill={color} />
    </Svg>
  );
}

export function ScanSearchIcon({ size = 29, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 29 29" fill="none" style={style}>
      <Path d="M3.625 8.25V6.04167C3.625 5.19675 4.32175 4.5 5.16667 4.5H7.375M21.625 4.5H23.8333C24.6782 4.5 25.375 5.19675 25.375 6.04167V8.25M25.375 20.75V22.9583C25.375 23.8032 24.6782 24.5 23.8333 24.5H21.625M7.375 24.5H5.16667C4.32175 24.5 3.625 23.8032 3.625 22.9583V20.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12.5" cy="12.5" r="4.33333" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.8333 15.8333L18.5 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function XCircleIcon({ size = 20, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Circle cx="10" cy="10" r="8.25" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function InfoIcon({ size = 20, color = colors.ink, strokeWidth = 1.4, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Circle cx="10" cy="10" r="8.25" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13.875V9.375" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="6.375" r="0.625" fill={color} />
    </Svg>
  );
}

export function ShareIcon({ size = 20, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RotateCcwIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 20, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v4M8 10v4M16 18v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BrainIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChartSplineIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 16c2.5-5 5.5-7 8-5s4.5 1 6-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowUpIcon({ size = 17, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="m5 12 7-7 7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 19V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VideoIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 8l-6 4 6 4V8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="2" y="6" width="14" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 20, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GraduationCapIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 10v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DownloadIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m7 10 5 5 5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15V3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TypeIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M4 7V4h16v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 20h6M12 4v16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VolumeIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M11 5 6 9H2v6h4l5 4V5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LanguagesIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="m5 8 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m4 14 6-6 2-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 5h12M7 2h1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m22 22-5-10-5 10M14 18h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HelpCircleIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 17h.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoonIcon({ size = 19, color = colors.ink, strokeWidth = 1.5, style }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
