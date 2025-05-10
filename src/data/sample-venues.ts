export interface Venue {
  id: string;
  name: { zh: string; ja: string; ko: string };
  address: string;
  lat: number;
  lng: number;
  categories: string[];    // 主分类：coffee, beer…
  serving: string[];       // Serving 区块标签
  services: string[];      // Services 区块标签
  tags: string[];          // 其它筛选标签
  contacts: {
    site?: string;
    ig?: string;
    fb?: string;
    tel?: string;
  };
  hours: {
    default: [string, string, string][];    // 周一–周日
    exceptions?: [string, string | null, string | null][];
  };
  status?: 'open' | 'closing' | 'closed';
  image?: string;
  distance?: number;
}

export const venues: Venue[] = [
  {
    id: '1',
    name: { zh: '宇宙咖啡', ja: 'コスモコーヒー', ko: '코스모커피' },
    address: '上海市黄浦区XX路100号',
    lat: 31.2285,
    lng: 121.4598,
    categories: ['coffee'],
    serving: ['espresso', 'filter', 'coldbrew'],
    services: ['wifi', 'credit', 'vegan'],
    tags: ['breakfast', 'handdrip'],
    contacts: {
      site: 'https://cosmocoffee.example.com',
      ig: 'cosmocoffee_sh',
      fb: 'cosmocoffeeSH',
      tel: '+86-21-12345678',
    },
    hours: {
      default: [
        ['Mon', '08:00', '16:00'],
        ['Tue', '08:00', '16:00'],
        ['Wed', '08:00', '16:00'],
        ['Thu', '08:00', '16:00'],
        ['Fri', '08:00', '16:00'],
        ['Sat', '10:00', '15:00'],
        ['Sun', '10:00', '15:00'],
      ],
      exceptions: [
        ['2025-10-01', '10:00', '18:00'], // 国庆特别营业时间
        ['2025-10-02', null, null],       // 国庆假期
      ],
    },
  },
  {
    id: '2',
    name: { zh: 'manner', ja: 'manner', ko: 'manner' },
    address: '上海市黄浦区XX路100号',
    lat: 31.2285,
    lng: 121.4598,
    categories: ['coffee'],
    serving: ['espresso', 'filter', 'coldbrew'],
    services: ['wifi', 'credit', 'vegan'],
    tags: ['breakfast', 'handdrip'],
    contacts: {
      site: 'https://cosmocoffee.example.com',
      ig: 'cosmocoffee_sh',
      fb: 'cosmocoffeeSH',
      tel: '+86-21-12345678',
    },
    hours: {
      default: [
        ['Mon', '08:00', '16:00'],
        ['Tue', '08:00', '16:00'],
        ['Wed', '08:00', '16:00'],
        ['Thu', '08:00', '16:00'],
        ['Fri', '08:00', '16:00'],
        ['Sat', '10:00', '15:00'],
        ['Sun', '10:00', '15:00'],
      ],
      exceptions: [
        ['2025-10-01', '10:00', '18:00'], // 国庆特别营业时间
        ['2025-10-02', null, null],       // 国庆假期
      ],
    },
  },
  {
    id: '3',
    name: { zh: '街垒bunker', ja: 'コスモコーヒー', ko: '코스모커피' },
    address: '上海市黄浦区XX路100号',
    lat: 31.2285,
    lng: 121.4598,
    categories: ['coffee'],
    serving: ['espresso', 'filter', 'coldbrew'],
    services: ['wifi', 'credit', 'vegan'],
    tags: ['breakfast', 'handdrip'],
    contacts: {
      site: 'https://cosmocoffee.example.com',
      ig: 'cosmocoffee_sh',
      fb: 'cosmocoffeeSH',
      tel: '+86-21-12345678',
    },
    hours: {
      default: [
        ['Mon', '08:00', '16:00'],
        ['Tue', '08:00', '16:00'],
        ['Wed', '08:00', '16:00'],
        ['Thu', '08:00', '16:00'],
        ['Fri', '08:00', '16:00'],
        ['Sat', '10:00', '15:00'],
        ['Sun', '10:00', '15:00'],
      ],
      exceptions: [
        ['2025-10-01', '10:00', '18:00'], // 国庆特别营业时间
        ['2025-10-02', null, null],       // 国庆假期
      ],
    },
  },
  {
    id: '4',
    name: { zh: "liquid's tag", ja: 'コスモコーヒー', ko: '코스모커피' },
    address: '上海市黄浦区XX路100号',
    lat: 31.2285,
    lng: 121.4598,
    categories: ['coffee'],
    serving: ['espresso', 'filter', 'coldbrew'],
    services: ['wifi', 'credit', 'vegan'],
    tags: ['breakfast', 'handdrip'],
    contacts: {
      site: 'https://cosmocoffee.example.com',
      ig: 'cosmocoffee_sh',
      fb: 'cosmocoffeeSH',
      tel: '+86-21-12345678',
    },
    hours: {
      default: [
        ['Mon', '08:00', '16:00'],
        ['Tue', '08:00', '16:00'],
        ['Wed', '08:00', '16:00'],
        ['Thu', '08:00', '16:00'],
        ['Fri', '08:00', '16:00'],
        ['Sat', '10:00', '15:00'],
        ['Sun', '10:00', '15:00'],
      ],
      exceptions: [
        ['2025-10-01', '10:00', '18:00'], // 国庆特别营业时间
        ['2025-10-02', null, null],       // 国庆假期
      ],
    },
  },
]; 