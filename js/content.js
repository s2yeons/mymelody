// Section colour themes for the shader background: [base, clouds, highlight]
export const THEMES = [
  ['#ffd6e7', '#ffabcb', '#fff3f8'], // hero
  ['#fff0f5', '#ffc6dc', '#ffe9a8'], // intro
  ['#ffe6f0', '#ff9fc5', '#ffffff'], // profile
  ['#ffd0e1', '#f68db4', '#fff2b8'], // sayings
  ['#ece2ff', '#ffc4dd', '#ffffff'], // friends
  ['#fff3e8', '#ffcade', '#ffe3f0'], // timeline
  ['#ffc0da', '#ff8db8', '#fff5a6'], // play
  ['#2e0a1c', '#5e1a3d', '#ff8fb8'], // outro
];

// Melody's transform per section (world units). Tweened by scroll.
const T = Math.PI * 2;
export const STAGES = [
  { x: 0, y: 0.45, s: 1, ry: 0, rx: 0, theme: 0 },
  { x: 2.7, y: 0.1, s: 0.95, ry: -0.55, rx: 0.05, theme: 1 },
  { x: -3.0, y: 0, s: 0.9, ry: 0.6, rx: 0, theme: 2 },
  { x: 3.5, y: -1.35, s: 0.55, ry: T - 0.4, rx: 0, theme: 3 },
  { x: 3.9, y: -2.2, s: 0.75, ry: T - 0.7, rx: -0.1, theme: 4 },
  { x: 3.3, y: -0.2, s: 0.78, ry: T - 0.6, rx: 0, theme: 5 },
  { x: 3.3, y: 0.55, s: 0.78, ry: T * 2 - 0.5, rx: 0, theme: 6 },
  { x: 0, y: -1.75, s: 0.5, ry: T * 3, rx: 0, theme: 7 },
];

export const SAYINGS = [
  { text: '속상한 날엔 달콤한 걸 먹고 한숨 푹 자래. 내일은 분명 괜찮대.', c: '#fff', foot: '오늘의 처방: 파운드케이크' },
  { text: '친구가 울 땐 아무 말 안 해도 돼. 그냥 옆에 있어 주래.', c: '#ffd43b', foot: '말보다 따뜻한 것' },
  { text: '케이크가 좀 찌그러져도 괜찮대. 맛있으면 된 거래!', c: '#ff8fb8', foot: '모양보단 마음' },
  { text: '천천히 걸어도 도착하는 곳은 똑같대.', c: '#c9b6ff', foot: '느긋함도 재능' },
  { text: '좋아하는 건 좋다고, 크게 말해도 된대.', c: '#4a1530', dark: true, foot: '좋아해! 좋아해!' },
  { text: '내일 걱정은 내일의 멜로디한테 맡기래.', c: '#ffe0ec', foot: '오늘은 오늘만큼만' },
];

const bunny = (hood, face = '#fffaf6', extra = '') => `
  <ellipse cx="34" cy="26" rx="11" ry="26" fill="${hood}" transform="rotate(-12 34 26)"/>
  <ellipse cx="66" cy="26" rx="11" ry="26" fill="${hood}" transform="rotate(12 66 26)"/>
  <circle cx="50" cy="60" r="34" fill="${hood}"/>
  <ellipse cx="50" cy="66" rx="27" ry="22" fill="${face}"/>
  <ellipse cx="39" cy="63" rx="3.2" ry="4.6" fill="#2a1520"/>
  <ellipse cx="61" cy="63" rx="3.2" ry="4.6" fill="#2a1520"/>
  <ellipse cx="50" cy="71" rx="4" ry="3" fill="#ffd43b"/>
  ${extra}`;

export const FRIENDS = [
  {
    name: '플랫', en: 'FLAT', role: '단짝 친구', c: '#cfe4ff',
    desc: '마음씨 착한 파란 생쥐. 멜로디와 함께라면 어디든 가는 믿음직한 단짝이에요.',
    svg: `<circle cx="24" cy="30" r="18" fill="#7fb6f5"/><circle cx="76" cy="30" r="18" fill="#7fb6f5"/>
      <circle cx="24" cy="30" r="10" fill="#dbeaff"/><circle cx="76" cy="30" r="10" fill="#dbeaff"/>
      <ellipse cx="50" cy="60" rx="33" ry="29" fill="#8fc2fb"/>
      <ellipse cx="39" cy="58" rx="3.4" ry="5" fill="#2a1520"/><ellipse cx="61" cy="58" rx="3.4" ry="5" fill="#2a1520"/>
      <ellipse cx="50" cy="68" rx="4.5" ry="3.2" fill="#ff8fb8"/>`,
  },
  {
    name: '쿠로미', en: 'KUROMI', role: '자칭 라이벌', c: '#e4d8ff',
    desc: '해골 장식 검은 두건의 장난꾸러기. 멜로디를 라이벌이라 부르지만, 사실 은근 다정해요.',
    svg: `<path d="M24 46 L10 6 Q30 12 40 32 Z" fill="#2a1520"/><path d="M76 46 L90 6 Q70 12 60 32 Z" fill="#2a1520"/>
      <circle cx="50" cy="58" r="34" fill="#2a1520"/>
      <ellipse cx="50" cy="66" rx="25" ry="20" fill="#fff"/>
      <circle cx="50" cy="36" r="7.5" fill="#ff8fb8"/><circle cx="47.5" cy="35" r="1.5" fill="#2a1520"/><circle cx="52.5" cy="35" r="1.5" fill="#2a1520"/>
      <ellipse cx="41" cy="64" rx="3.2" ry="4.8" fill="#2a1520"/><ellipse cx="59" cy="64" rx="3.2" ry="4.8" fill="#2a1520"/>
      <ellipse cx="50" cy="72" rx="3.4" ry="2.4" fill="#ffd43b"/>`,
  },
  {
    name: '마이 스위트 피아노', en: 'MY SWEET PIANO', role: '양 친구', c: '#ffe0ec',
    desc: '폭신폭신한 분홍 양. 말수는 적지만 멜로디 곁을 늘 포근하게 지켜 줘요.',
    svg: `${[[28, 34], [50, 26], [72, 34], [22, 56], [78, 56], [30, 78], [50, 84], [70, 78]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#ffc2da"/>`).join('')}
      <ellipse cx="50" cy="60" rx="24" ry="22" fill="#fff6f0"/>
      <ellipse cx="41" cy="58" rx="3" ry="4.4" fill="#2a1520"/><ellipse cx="59" cy="58" rx="3" ry="4.4" fill="#2a1520"/>
      <ellipse cx="50" cy="67" rx="3.4" ry="2.4" fill="#ff8fb8"/>`,
  },
  {
    name: '리듬', en: 'RHYTHM', role: '남동생', c: '#fff1b8',
    desc: '멜로디의 남동생. 호기심이 많아서 누나를 자주 쫓아다니는 귀여운 개구쟁이.',
    svg: bunny('#9fd3ff'),
  },
  {
    name: '엄마', en: 'MAMA', role: '베이킹 마스터', c: '#ffd3e4',
    desc: '쿠키와 케이크의 달인. 멜로디가 곤란할 때마다 떠올리는 다정한 말의 주인공이에요.',
    svg: bunny('#ffb3cf', '#fffaf6', '<path d="M40 30 Q50 20 60 30 L57 40 L43 40 Z" fill="#fff" stroke="#f3c9d9" stroke-width="2"/>'),
  },
  {
    name: '할머니', en: 'GRANDMA', role: '두건 장인', c: '#e9f7e1',
    desc: '멜로디의 트레이드마크, 핑크 두건을 직접 만들어 주신 분. 손끝이 아주 야무지세요.',
    svg: bunny('#d9c2e8', '#fffaf6', '<circle cx="39" cy="63" r="8" fill="none" stroke="#8a4a68" stroke-width="2.4"/><circle cx="61" cy="63" r="8" fill="none" stroke="#8a4a68" stroke-width="2.4"/><path d="M47 63 H53" stroke="#8a4a68" stroke-width="2.4"/>'),
  },
];

export const HISTORY = [
  { year: '1975', title: '작은 토끼의 탄생', text: '동화 「빨간 두건」에서 영감을 받은 작은 토끼로 처음 세상에 나왔어요.' },
  { year: 'PINK', title: '두건이 핑크로', text: '처음엔 빨간 두건이었지만, 이제는 핑크 두건이 멜로디의 트레이드마크가 되었어요.' },
  { year: '2005', title: '오네가이 마이멜로디', text: 'TV 애니메이션이 방영되고, 영원한(?) 라이벌 쿠로미가 처음 등장했어요.' },
  { year: '2025', title: '50주년', text: '반세기 동안 사랑받은 토끼. 세대를 넘어 여전히 다정한 얼굴이에요.' },
  { year: '2026', title: '지금, 여기', text: '그리고 지금 이 페이지에서 당신과 만나는 중 ♡' },
];

export const NOTES = [
  { label: '도', key: 'a', f: 523.25, c: '#ff9ec4' },
  { label: '레', key: 's', f: 587.33, c: '#ffb38a' },
  { label: '미', key: 'd', f: 659.25, c: '#ffe066' },
  { label: '파', key: 'f', f: 698.46, c: '#b8f0a0' },
  { label: '솔', key: 'g', f: 783.99, c: '#9fe3ff' },
  { label: '라', key: 'h', f: 880.0, c: '#b9a6ff' },
  { label: '시', key: 'j', f: 987.77, c: '#ffb3e6' },
  { label: '도', key: 'k', f: 1046.5, c: '#ff8fb8' },
];

// Twinkle Twinkle Little Star (public domain). -1 = rest.
export const SONG = [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1, 4, 4, 3, 3, 2, 2, 1, -1, 4, 4, 3, 3, 2, 2, 1, -1, 0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0];
