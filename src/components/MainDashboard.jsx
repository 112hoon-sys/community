import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LangSelector from './LangSelector';
import { fetchPosts, fetchNotifications, fetchCommunityRooms } from '../lib/api';
import TranslatableText from './TranslatableText';
import { useAuth } from '../contexts/AuthContext';
import {
  Globe,
  Bell,
  Search,
  DollarSign,
  Briefcase,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  MessageCircle,
  Home,
  User,
  X
} from 'lucide-react';

const CACHE_KEY = 'kconnect_rates_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10遺?
const LOCALE_MAP = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN', zh: 'zh-CN', th: 'th-TH', id: 'id-ID' };
const MainDashboard = () => {
  const { lang: ctxLang, setLang: setCtxLang, t: ctxT, supportedLangs } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const locale = LOCALE_MAP[ctxLang] || 'en-US';
  const isKo = ctxLang === 'ko';
  const [baseAmount, setBaseAmount] = useState(1000);

  const [exchangeRates, setExchangeRates] = useState([]);
  const [rateMeta, setRateMeta] = useState({
    updatedAt: ''
  });
  const [rateError, setRateError] = useState('');
  const [rateSource, setRateSource] = useState('');
  const [showAllRates, setShowAllRates] = useState(false);

  const [feedPosts, setFeedPosts] = useState([]);
  const [feedStatus, setFeedStatus] = useState('loading');
  const [feedSort, setFeedSort] = useState('latest');
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [marketItems, setMarketItems] = useState([]);
  const [marketStatus, setMarketStatus] = useState('loading');
  const [jobItems, setJobItems] = useState([]);
  const [jobStatus, setJobStatus] = useState('loading');
  const [communityRooms, setCommunityRooms] = useState([]);
  const [communityStatus, setCommunityStatus] = useState('idle');

  const [modalItem, setModalItem] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const roomFlags = {
    vn: '🇻🇳',
    cn: '🇨🇳',
    th: '🇹🇭',
    id: '🇮🇩',
    ph: '🇵🇭',
    my: '🇲🇾',
    np: '🇳🇵',
    kh: '🇰🇭',
    mm: '🇲🇲',
    en: '🌐',
    other: '✨'
  };

  useEffect(() => {
    if (!user?.sub) return;
    fetchNotifications(user.sub)
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [user?.sub]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);
  const MOCK_MARKET_KO = [
    { id: 'm1', title: '샤오미 밥솥', meta: '중고 - 상태 좋음', price: '25,000원', region: '안산', tag: '급처', detail: '보온 기능 정상 작동, 직거래 선호.', color: 'linear-gradient(135deg, #ffe6e6, #ffd6b0)' },
    { id: 'm2', title: '전자레인지', meta: '1년 사용 - 직거래', price: '25,000원', region: '수원', tag: '인기', detail: '생활 스크래치 약간, 사용에는 문제 없음.', color: 'linear-gradient(135deg, #e6f2ff, #d1e1ff)' },
    { id: 'm3', title: '베트남 식재료 세트', meta: '공동구매', price: '8,000원', region: '구로', tag: '공구', detail: '쌀국수 재료 + 기본 양념 포함, 주말 픽업.', color: 'linear-gradient(135deg, #e7f8f0, #d2f0e1)' },
    { id: 'm4', title: '중고 자전거', meta: '학생 - 가볍게 사용', price: '20,000원', region: '안양', tag: '가성비', detail: '정비 완료, 헬멧 포함.', color: 'linear-gradient(135deg, #f0e7ff, #e1d1ff)' }
  ];
const MOCK_MARKET_EN = [
  { id: 'm1', title: 'Xiaomi rice cooker', meta: 'Used - great condition', price: 'KRW 25,000', region: 'Ansan', tag: 'Hot', detail: 'Keeps warm well, prefer pickup.', color: 'linear-gradient(135deg, #ffe6e6, #ffd6b0)' },
  { id: 'm2', title: 'Microwave', meta: '1 year use - pickup', price: 'KRW 25,000', region: 'Suwon', tag: 'Popular', detail: 'Minor scratches, works perfectly.', color: 'linear-gradient(135deg, #e6f2ff, #d1e1ff)' },
  { id: 'm3', title: 'Grocery bundle', meta: 'Group buy', price: 'KRW 8,000', region: 'Guro', tag: 'Group', detail: 'Pho ingredients + basic spices. Weekend pickup.', color: 'linear-gradient(135deg, #e7f8f0, #d2f0e1)' },
  { id: 'm4', title: 'Used bicycle', meta: 'Commute - lightly used', price: 'KRW 20,000', region: 'Anyang', tag: 'Value', detail: 'Recently tuned, helmet included.', color: 'linear-gradient(135deg, #f0e7ff, #e1d1ff)' }
];
  const MOCK_JOB_KO = [
    { id: 'j1', title: '카페 스태프', meta: '주말 - 4시간', wage: '시급 12,000원', region: '안산', tag: '즉시', detail: '주말 오전, 음료 제조.', color: 'linear-gradient(135deg, #fff4dc, #ffe1b3)' },
    { id: 'j2', title: '물류 포장', meta: '야간 - 로테이션', wage: '월급 2,700,000원', region: '수원', tag: '상시', detail: '야간 22-06, 주 5일.', color: 'linear-gradient(135deg, #e6f7ff, #cfe7ff)' },
    { id: 'j3', title: '주방 보조', meta: '오전 - 주 5일', wage: '시급 11,000원', region: '구로', tag: '인기', detail: '전처리/설거지 보조.', color: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
    { id: 'j4', title: '편의점 야간', meta: '야간 - 주 3일', wage: '시급 13,000원', region: '안양', tag: '야간', detail: '캐셔 및 매장 정리.', color: 'linear-gradient(135deg, #e9f7ef, #d4f0dd)' }
  ];
const MOCK_JOB_EN = [
  { id: 'j1', title: 'Cafe staff', meta: 'Weekend - 4 hours', wage: 'KRW 12,000 / hr', region: 'Ansan', tag: 'Now', detail: 'Sat/Sun mornings, basic drinks.', color: 'linear-gradient(135deg, #fff4dc, #ffe1b3)' },
  { id: 'j2', title: 'Logistics packing', meta: 'Night shift - rotation', wage: 'KRW 2,700,000 / mo', region: 'Suwon', tag: 'Hiring', detail: 'Night 22-06, 5 days a week.', color: 'linear-gradient(135deg, #e6f7ff, #cfe7ff)' },
  { id: 'j3', title: 'Kitchen assistant', meta: 'AM - 5 days', wage: 'KRW 11,000 / hr', region: 'Guro', tag: 'Popular', detail: 'Prep & dish support.', color: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
  { id: 'j4', title: 'Convenience store night shift', meta: 'Night - 3 days', wage: 'KRW 13,000 / hr', region: 'Anyang', tag: 'Night', detail: 'Cashier and store cleanup.', color: 'linear-gradient(135deg, #e9f7ef, #d4f0dd)' }
];
  const MOCK_TRENDING_KO = [
    { id: 'p1', title: '안산에서 정통 쌀국수 재료 어디서 사나요?', comments: 12, likes: 24, time: '방금', tag: '음식', category: 'food', timestamp: Date.now() - 5 * 60 * 1000 },
    { id: 'p2', title: '비자 연장 서류 작성 팁 공유합니다', comments: 18, likes: 43, time: '30분 전', tag: '비자', category: 'visa', timestamp: Date.now() - 30 * 60 * 1000 },
    { id: 'p3', title: '주말 베트남 식재료 공동구매 하실 분?', comments: 9, likes: 17, time: '1시간 전', tag: '공동구매', category: 'life', timestamp: Date.now() - 60 * 60 * 1000 },
    { id: 'p4', title: '수원 월세 계약 전 체크할 것들', comments: 22, likes: 31, time: '2시간 전', tag: '주거', category: 'life', timestamp: Date.now() - 2 * 60 * 60 * 1000 },
    { id: 'p5', title: 'ARC 재발급 방법 정리', comments: 7, likes: 19, time: '3시간 전', tag: '서류', category: 'visa', timestamp: Date.now() - 3 * 60 * 60 * 1000 },
    { id: 'p6', title: '송금 수수료 낮은 은행 추천', comments: 14, likes: 28, time: '5시간 전', tag: '금융', category: 'life', timestamp: Date.now() - 5 * 60 * 60 * 1000 },
    { id: 'p7', title: '구로 야간 알바 구합니다', comments: 11, likes: 16, time: '어제', tag: '구인', category: 'jobs', timestamp: Date.now() - 26 * 60 * 60 * 1000 },
    { id: 'p8', title: '겨울 난방비 줄이는 팁', comments: 6, likes: 22, time: '어제', tag: '생활', category: 'life', timestamp: Date.now() - 28 * 60 * 60 * 1000 }
  ];
const MOCK_TRENDING_EN = [
  { id: 'p1', title: 'Where can I buy authentic pho ingredients in Ansan?', comments: 12, likes: 24, time: 'Just now', tag: 'Food', category: 'food', timestamp: Date.now() - 5 * 60 * 1000 },
  { id: 'p2', title: 'Sharing tips for visa extension forms', comments: 18, likes: 43, time: '30 min ago', tag: 'Visa', category: 'visa', timestamp: Date.now() - 30 * 60 * 1000 },
  { id: 'p3', title: 'Anyone in for a weekend Vietnamese grocery group buy?', comments: 9, likes: 17, time: '1 hour ago', tag: 'Group buy', category: 'life', timestamp: Date.now() - 60 * 60 * 1000 },
  { id: 'p4', title: 'Things to check before signing a lease in Suwon', comments: 22, likes: 31, time: '2 hours ago', tag: 'Housing', category: 'life', timestamp: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 'p5', title: 'How to reissue your ARC after losing it', comments: 7, likes: 19, time: '3 hours ago', tag: 'Docs', category: 'visa', timestamp: Date.now() - 3 * 60 * 60 * 1000 },
  { id: 'p6', title: 'Which bank has lower remittance fees?', comments: 14, likes: 28, time: '5 hours ago', tag: 'Finance', category: 'life', timestamp: Date.now() - 5 * 60 * 60 * 1000 },
  { id: 'p7', title: 'Looking for late-night part-time work in Guro', comments: 11, likes: 16, time: 'Yesterday', tag: 'Jobs', category: 'jobs', timestamp: Date.now() - 26 * 60 * 60 * 1000 },
  { id: 'p8', title: 'Tips to reduce heating bills in winter', comments: 6, likes: 22, time: 'Yesterday', tag: 'Life', category: 'life', timestamp: Date.now() - 28 * 60 * 60 * 1000 }
];
  const t = useMemo(() => {
    const heroStats = [{ value: '4,820+', label: ctxT.heroStatsMembers || 'Active members' }, { value: '180+', label: ctxT.heroStatsJobs || 'Live jobs' }];
    const categories = [{ name: ctxT.catVisa, desc: ctxT.catVisaDesc }, { name: ctxT.catJobs, desc: ctxT.catJobsDesc }, { name: ctxT.catMarket, desc: ctxT.catMarketDesc }, { name: ctxT.catMoney, desc: ctxT.catMoneyDesc }];
    const feedSorts = { latest: ctxT.sortLatest, popular: ctxT.sortPopular, comments: ctxT.sortComments };
    const feedFilters = {
      all: ctxT.filterAll || '전체',
      visa: ctxT.filterVisa || '비자/행정',
      region: ctxT.filterRegion || '지역정보',
      life: ctxT.filterLife || '생활정보',
      nationality: ctxT.filterNationality || '국적/언어',
      job: ctxT.filterJobs || '구인구직',
      market: ctxT.filterMarket || '중고마켓',
      remittance: ctxT.filterRemittance || '송금/환율'
    };
    return {
      ...ctxT,
      heroStats, categories, feedSorts, feedFilters,
      marketSectionTitle: ctxT.marketSection, marketSectionSubtitle: ctxT.marketSub, jobSectionTitle: ctxT.jobSection, jobSectionSubtitle: ctxT.jobSub,
      feedSortLabel: ctxT.feedSort, feedFilterLabel: ctxT.feedFilter,
      marketItems: isKo ? MOCK_MARKET_KO : MOCK_MARKET_EN,
      jobItems: isKo ? MOCK_JOB_KO : MOCK_JOB_EN,
      trendingPosts: isKo ? MOCK_TRENDING_KO : MOCK_TRENDING_EN
    };
  }, [ctxT, isKo]);

  const formatRate = (rate, unit) => {
    if (rate === null || Number.isNaN(rate)) return '-';
    const value = rate * baseAmount;
    const isVnd = (unit || '').toUpperCase() === 'VND';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: isVnd ? 0 : 2,
      maximumFractionDigits: isVnd ? 0 : 2
    }).format(value);
  };

  const formatUpdatedAt = (utcString) => {
    if (!utcString) return '';
    const date = new Date(utcString);
    if (Number.isNaN(date.getTime())) return utcString;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  useEffect(() => {
    const controller = new AbortController();
    let cacheHit = false;

    const loadCache = () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const cached = JSON.parse(raw);
        if (!cached?.rates || !Array.isArray(cached.rates) || !cached?.ts) return false;
        cacheHit = true;
        const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;
        setExchangeRates(cached.rates);
        setRateMeta({ updatedAt: cached.updatedAt || '' });
        setRateSource(isFresh ? 'cache' : 'stale');
        return isFresh;
      } catch {
        return false;
      }
    };

    const fetchRates = async () => {
      try {
        setRateError('');
        const base = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${base}/api/exchange/rates`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('rate fetch failed');
        const data = await response.json();
        const rates = data?.rates || [];
        setExchangeRates(rates);
        setRateMeta({ updatedAt: data?.updatedAt || '' });
        setRateSource('live');
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            ts: Date.now(),
            updatedAt: data?.updatedAt || '',
            rates
          })
        );
      } catch (error) {
        if (error?.name !== 'AbortError') {
          if (!cacheHit) {
            setRateError(t.rateError);
          } else {
            setRateSource('stale');
          }
        }
      }
    };

    loadCache();
    fetchRates();

    return () => controller.abort();
  }, [t.rateError]);

  useEffect(() => {
    let cancelled = false;
    setFeedStatus('loading');

    const load = async () => {
      try {
        const data = await fetchPosts();
        if (cancelled) return;

        const allowedBoards = new Set(['life', 'visa', 'region', 'nationality', 'job', 'market', 'remittance']);
        const mapped = (data || []).filter((post) => allowedBoards.has(post.board?.key || 'life')).map((post) => {
          const created = new Date(post.createdAt);
          const timestamp = created.getTime();
          const comments = post._count?.comments ?? 0;
          const likes = post._count?.likes ?? 0;
          const boardKey = post.board?.key || 'life';
          const category = boardKey || 'life';

          const time = new Intl.DateTimeFormat(locale, {
            dateStyle: 'short',
            timeStyle: 'short'
          }).format(created);

          return {
            id: post.id,
            title: post.title,
            content: post.content || '',
            comments,
            likes,
            time,
            imageUrl: post.imageUrl || '',
            authorPicture: post.author?.picture || '',
            authorName: post.author?.name || '',
            tag: post.board?.nameKo || post.board?.nameEn || boardKey,
            category,
            timestamp
          };
        });

        setFeedPosts(mapped);
        setFeedStatus('success');
      } catch {
        if (cancelled) return;
        // API ?ㅽ뙣 ??湲곗〈 ?붾? ?곗씠?곕줈 ?대갚
        setFeedPosts(t.trendingPosts);
        setFeedStatus('success');
      }
    };

    load();
    const intervalId = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [ctxLang]);

  useEffect(() => {
    let marketTimer;
    let jobTimer;

    setMarketStatus('loading');
    setJobStatus('loading');
    const extractPrice = (text = '') => {
      const m = text.match(/(\d[\d,]{2,})(?:\s*KRW)?/i);
      return m ? `${m[1].replace(/,/g, ',')} KRW` : null;
    };
    const mapMarketPosts = (posts) =>
      (posts || []).slice(0, 4).map((post, idx) => {
        const created = new Date(post.createdAt);
        const comments = post._count?.comments ?? 0;
        const likes = post._count?.likes ?? 0;
        const snippet = post.content.slice(0, 40) + (post.content.length > 40 ? '...' : '');
        const price =
          extractPrice(post.title) || extractPrice(post.content) || `Comments ${comments} - Likes ${likes}`;

        const gradients = [
          'linear-gradient(135deg, #ffe6e6, #ffd6b0)',
          'linear-gradient(135deg, #e6f2ff, #d1e1ff)',
          'linear-gradient(135deg, #e7f8f0, #d2f0e1)',
          'linear-gradient(135deg, #f0e7ff, #e1d1ff)'
        ];

        return {
          id: post.id,
          title: post.title,
          meta: snippet,
          price,
          imageUrl: post.imageUrl || '',
          region: created.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
          tag: post.board?.nameKo || post.board?.nameEn || 'Market',
          detail: post.content,
          color: gradients[idx % gradients.length]
        };
      });

    const mapJobPosts = (posts) =>
      (posts || []).slice(0, 4).map((post, idx) => {
        const created = new Date(post.createdAt);
        const comments = post._count?.comments ?? 0;
        const likes = post._count?.likes ?? 0;
        const snippet = post.content.slice(0, 40) + (post.content.length > 40 ? '...' : '');
        const wage =
          extractPrice(post.title) || extractPrice(post.content) || `Comments ${comments} - Likes ${likes}`;

        const gradients = [
          'linear-gradient(135deg, #fff4dc, #ffe1b3)',
          'linear-gradient(135deg, #e6f7ff, #cfe7ff)',
          'linear-gradient(135deg, #fce7f3, #fbcfe8)',
          'linear-gradient(135deg, #e9f7ef, #d4f0dd)'
        ];

        return {
          id: post.id,
          title: post.title,
          meta: snippet,
          wage,
          imageUrl: post.imageUrl || '',
          region: created.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
                    tag: post.board?.nameKo || post.board?.nameEn || 'Jobs',
          detail: post.content,
          color: gradients[idx % gradients.length]
        };
      });

    Promise.all([fetchPosts('market'), fetchPosts('job')])
      .then(([marketPosts, jobPosts]) => {
        setMarketItems(mapMarketPosts(marketPosts));
        setMarketStatus('success');
        setJobItems(mapJobPosts(jobPosts));
        setJobStatus('success');
      })
      .catch(() => {
        setMarketItems(t.marketItems);
        setMarketStatus('success');
        setJobItems(t.jobItems);
        setJobStatus('success');
      });

    return () => {
      clearTimeout(marketTimer);
      clearTimeout(jobTimer);
    };
  }, [ctxLang, locale, t.marketItems, t.jobItems]);

  useEffect(() => {
    if (feedFilter !== 'nationality') return;
    setCommunityStatus('loading');
    fetchCommunityRooms()
      .then((rooms) => {
        setCommunityRooms(rooms || []);
        setCommunityStatus('success');
      })
      .catch(() => {
        setCommunityRooms([]);
        setCommunityStatus('error');
      });
  }, [feedFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sort = params.get('sort');
    const filter = params.get('filter');

    if (sort && ['latest', 'popular', 'comments'].includes(sort)) {
      setFeedSort(sort);
    }
    const normalizedFilter = filter === 'food' ? 'region' : filter;
    if (normalizedFilter && ['all', 'visa', 'region', 'life', 'nationality', 'job', 'market', 'remittance'].includes(normalizedFilter)) {
      setFeedFilter(normalizedFilter);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', feedSort);
    params.set('filter', feedFilter);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [feedSort, feedFilter]);

  useEffect(() => {
    document.body.style.overflow = modalItem ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalItem]);

  const categories = [
    {
      key: 'visa',
      icon: <ShieldCheck size={22} />,
      tone: 'accent-rose'
    },
    {
      key: 'jobs',
      icon: <Briefcase size={22} />,
      tone: 'accent-sky'
    },
    {
      key: 'market',
      icon: <ShoppingBag size={22} />,
      tone: 'accent-emerald'
    },
    {
      key: 'money',
      icon: <DollarSign size={22} />,
      tone: 'accent-amber'
    }
  ];

  const baseOptions = [1000, 1000000]; // 泥쒖썝, 諛깅쭔??
  const sortPosts = (posts) => {
    const list = [...posts];
    if (feedSort === 'latest') {
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (feedSort === 'popular') {
      return list.sort((a, b) => b.likes - a.likes);
    }
    return list.sort((a, b) => b.comments - a.comments);
  };

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const matchesSearch = (post) => {
    if (!normalizedQuery) return true;
    return [
      post.title,
      post.content,
      post.tag,
      post.authorName
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(normalizedQuery));
  };

  const filteredPosts = sortPosts(
    (feedFilter === 'all'
      ? feedPosts
      : feedPosts.filter((post) =>
          feedFilter === 'region'
            ? post.category === 'region' || post.category === 'food'
            : post.category === feedFilter
        ))
      .filter(matchesSearch)
  );

  const visiblePosts = filteredPosts.slice(0, 8);
  const filteredRooms = communityRooms.filter((room) => {
    if (!normalizedQuery) return true;
    return [room.nameKo, room.nameEn, room.description, room.lastMessage]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(normalizedQuery));
  });

  const openModal = (item, type) => {
    setModalItem({ ...item, type });
  };

  const closeModal = () => {
    setModalItem(null);
  };

  const handleSearch = () => {
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/boards?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-kicker">{t.brandKicker}</p>
          <h1 className="brand-title">KoreaMate</h1>
        </div>
        <div className="header-actions">
          <LangSelector
            currentLang={ctxLang}
            onSelect={setCtxLang}
            supportedLangs={supportedLangs}
          />
          {user ? (
            <div className="header-user">
              <Link to="/profile" className="header-user-badge" title={user.name || user.email || ''}>
                <span className="avatar-wrapper" aria-hidden="true">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    <span className="avatar-fallback" aria-hidden="true">
                      <User size={14} />
                    </span>
                  )}
                </span>
                <span className="user-name">{user.name || user.email || 'User'}</span>
              </Link>
              <button type="button" className="logout-button" onClick={logout}>
                {t.logout || 'Logout'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="icon-button" aria-label={t.login}>
              <User size={18} />
            </Link>
          )}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="icon-button"
              aria-label={t.notifications}
              onClick={() => user && setShowNotif((v) => !v)}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {user && notifications.filter((n) => !n.read).length > 0 && (
                <span
                  className="notif-badge"
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 7,
                    background: '#e11d48',
                    color: '#fff',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            {showNotif && user && (
              <div
                className="notif-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  minWidth: 280,
                  maxHeight: 320,
                  overflow: 'auto',
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 100
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
                  {t.notifications}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: 16, color: '#6b7280', margin: 0 }}>{t.notificationsEmpty}</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={`/post/${n.postId}`}
                      onClick={() => setShowNotif(false)}
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#374151',
                        textDecoration: 'none',
                        background: n.read ? undefined : 'rgba(59, 130, 246, 0.06)'
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{n.actorName || 'Someone'}</span>
                      {n.type === 'comment' ? t.notifComment : n.type === 'like' ? t.notifLike : (t.notifChat || ' sent you a message.')}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <nav className="top-nav">
        <div className="top-nav-links">
          <Link to="/" className="top-nav-link">{t.topNav?.[0]}</Link>
          <Link to="/boards" className="top-nav-link">{t.topNav?.[1]}</Link>
          <Link to="/board/market" className="top-nav-link">{t.topNav?.[2]}</Link>
          <Link to="/board/job" className="top-nav-link">{t.topNav?.[3]}</Link>
        </div>
        <button
          type="button"
          className="top-nav-cta"
          onClick={() => navigate(user ? '/post/new' : '/login')}
        >
          {t.newPost}
        </button>
      </nav>

      <a
        className="ad-link"
        href="https://www.sbicosmoney.com/"
        target="_blank"
        rel="noreferrer"
        aria-label="SBI 코스머니로 이동"
      >
        <section className="ad-card">
          <div className="ad-glow" aria-hidden="true" />
          <div className="ad-content">
            <div className="ad-top">
              <span className="ad-badge">Sponsored</span>
              <div className="ad-brand">
                <span className="ad-logo">SBI</span>
                <span className="ad-brand-text">Cosmoney</span>
              </div>
            </div>
            <div className="ad-body">
              <div className="ad-copy">
                <h2 className="ad-title">더 빠르고 간편한 해외송금</h2>
                <p className="ad-subtext">
                  최저 수수료, 실시간 환율, 주요 국가 당일 송금. SBI 코스머니로 안전하게 보내세요.
                </p>
                <div className="ad-points">
                  <div className="ad-point">
                    <strong>0.5%~</strong>
                    <span>송금 수수료</span>
                  </div>
                  <div className="ad-point">
                    <strong>24h</strong>
                    <span>환율 업데이트</span>
                  </div>
                  <div className="ad-point">
                    <strong>20+</strong>
                    <span>지원 국가</span>
                  </div>
                </div>
                <div className="ad-cta-row">
                  <button type="button" className="ad-cta">지금 보내기</button>
                  <button type="button" className="ad-ghost">수수료 계산</button>
                  <span className="ad-note">1분이면 완료</span>
                </div>
              </div>
              <div className="ad-visual" aria-hidden="true">
                <div className="ad-visual-card">
                  <div className="ad-visual-row">
                    <span className="ad-visual-label">오늘의 환율</span>
                    <span className="ad-visual-rate">₩1,325</span>
                  </div>
                  <div className="ad-visual-row">
                    <span className="ad-visual-label">수취 예상</span>
                    <span className="ad-visual-rate">1,000,000</span>
                  </div>
                  <div className="ad-visual-row">
                    <span className="ad-visual-label">도착 시간</span>
                    <span className="ad-visual-rate">당일</span>
                  </div>
                </div>
                <div className="ad-visual-pill">첫 송금 0원 수수료</div>
              </div>
            </div>
          </div>
        </section>
      </a>

      <main className="desktop-grid">
        <div className="primary-col">
          <section className="search-section">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
                if (e.key === 'Escape') setSearchTerm('');
              }}
            />
            <button
              type="button"
              className="search-chip"
              onClick={handleSearch}
              aria-label={t.searchAction || '검색'}
            >
              {t.searchAction || '검색'}
            </button>
          </section>

          <section className="categories">
            {categories.map((cat, idx) => (
              <Link
                key={cat.key}
                to={cat.key === 'visa' ? '/board/life' : cat.key === 'jobs' ? '/board/job' : cat.key === 'market' ? '/board/market' : '/board/remittance'}
                className={`category-card ${cat.tone}`}
              >
                <div className="category-icon">{cat.icon}</div>
                <div>
                  <h4>{t.categories[idx].name}</h4>
                  <p>{t.categories[idx].desc}</p>
                </div>
              </Link>
            ))}
          </section>

          <section className="rates-section">
            <div className="section-header">
              <h3>{t.quickRates}</h3>
              <a
                className="rate-cta"
                href="https://www.sbicosmoney.com/"
                target="_blank"
                rel="noreferrer"
              >
                {t.rateCta || '송금하러가기'}
              </a>
            </div>
            <div className="rate-controls">
              {baseOptions.map((amount) => (
                <button
                  key={amount}
                  className={`rate-toggle ${baseAmount === amount ? 'active' : ''}`}
                  onClick={() => setBaseAmount(amount)}
                >
                  {amount.toLocaleString(locale)} KRW
                </button>
              ))}
            </div>
            {rateError ? (
              <p className="rate-error">{rateError}</p>
            ) : (
              <p className="rate-meta">
                {t.rateUpdated}: {formatUpdatedAt(rateMeta.updatedAt) || t.rateUpdating}
                {rateSource === 'cache' ? ` (${t.rateCached})` : ''}
                {rateSource === 'stale' ? ` (${t.rateStale})` : ''}
              </p>
            )}
            <div className="rate-track">
              {(showAllRates ? exchangeRates : exchangeRates.slice(0, 4)).map((item) => (
                <article key={item.country} className="rate-card">
                  <div className="rate-top">
                    <span>{item.country}</span>
                    <span>{item.flag}</span>
                  </div>
                  <div className="rate-value">{formatRate(item.rate, item.unit)}</div>
                  <div className="rate-unit">{item.unit}</div>
                </article>
              ))}
            </div>
            {exchangeRates.length > 4 && (
              <div className="rate-more">
                <button
                  type="button"
                  className="rate-more-btn"
                  onClick={() => setShowAllRates((v) => !v)}
                >
                  {showAllRates ? (t.rateCollapse || '접기') : (t.rateMore || '더보기')}
                </button>
              </div>
            )}
            <p className="rate-attrib" aria-hidden="true" />
          </section>

          <section className="mini-section">
            <div className="section-header">
              <div>
                <h3>{t.marketSectionTitle}</h3>
                <p className="section-subtitle">{t.marketSectionSubtitle}</p>
              </div>
              <Link to="/board/market" className="link">{t.viewAll}</Link>
            </div>
            {marketStatus === 'loading' && (
              <p className="feed-status">{t.marketLoading}</p>
            )}
            {marketStatus === 'success' && (
              <div className="card-grid">
                {marketItems.map((item) => (
                  <button
                    key={item.id}
                    className="info-card clickable"
                    onClick={() => navigate(`/post/${item.id}`)}
                  >
                    <div
                      className="thumb"
                      style={
                        item.imageUrl
                          ? {
                              backgroundImage: `url(${item.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }
                          : { background: item.color }
                      }
                    />
                    <div className="info-body">
                      <div className="info-tag">{item.tag}</div>
                      <h4>{item.title}</h4>
                      <p className="info-meta">{item.meta}</p>
                      <div className="info-footer">
                        <span>{item.region}</span>
                        <strong>{item.price}</strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mini-section">
            <div className="section-header">
              <div>
                <h3>{t.jobSectionTitle}</h3>
                <p className="section-subtitle">{t.jobSectionSubtitle}</p>
              </div>
              <Link to="/board/job" className="link">{t.viewAll}</Link>
            </div>
            {jobStatus === 'loading' && (
              <p className="feed-status">{t.jobLoading}</p>
            )}
            {jobStatus === 'success' && (
              <div className="card-grid">
                {jobItems.map((item) => (
                  <button
                    key={item.id}
                    className="info-card clickable"
                    onClick={() => navigate(`/post/${item.id}`)}
                  >
                    <div
                      className="thumb"
                      style={
                        item.imageUrl
                          ? {
                              backgroundImage: `url(${item.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }
                          : { background: item.color }
                      }
                    />
                    <div className="info-body">
                      <div className="info-tag">{item.tag}</div>
                      <h4>{item.title}</h4>
                      <p className="info-meta">{item.meta}</p>
                      <div className="info-footer">
                        <span>{item.region}</span>
                        <strong>{item.wage}</strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="secondary-col">
          <section className="trending">
            <div className="section-header">
              <h3>{t.trendingTitle}</h3>
              <Link to="/boards" className="link">{t.viewAll}</Link>
            </div>
            <div className="feed-controls">
              <div>
                <p className="control-label">{t.feedSortLabel}</p>
                <div className="control-row">
                  {Object.entries(t.feedSorts).map(([key, label]) => (
                    <button
                      key={key}
                      className={`pill ${feedSort === key ? 'active' : ''}`}
                      onClick={() => setFeedSort(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="control-label">{t.feedFilterLabel}</p>
                <div className="control-row">
                  {Object.entries(t.feedFilters).map(([key, label]) => (
                    <button
                      key={key}
                      className={`pill ${feedFilter === key ? 'active' : ''}`}
                      onClick={() => setFeedFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {feedStatus === 'loading' && (
              <p className="feed-status">{t.feedLoading}</p>
            )}
            {feedStatus === 'error' && (
              <p className="feed-status error">{t.feedError}</p>
            )}
            {feedStatus === 'success' && (
              <>
                {feedFilter === 'nationality' ? (
                  <div className="community-room-list">
                    {communityStatus === 'loading' && (
                      <p className="feed-status">{t.feedLoading}</p>
                    )}
                    {communityStatus === 'error' && (
                      <p className="feed-status error">{t.feedError}</p>
                    )}
                    {communityStatus === 'success' && filteredRooms.length === 0 && (
                      <p className="feed-status">아직 채팅방이 없습니다.</p>
                    )}
                    {communityStatus === 'success' && filteredRooms.map((room) => (
                      <Link key={room.id} to={`/community/${room.id}`} className="community-room-card">
                        <div className="room-flag">
                          <span>{roomFlags[room.key] || '🌏'}</span>
                        </div>
                        <div className="room-main">
                          <div className="room-head">
                            <h3>{room.nameKo}</h3>
                            <span className="community-room-count">{room._count?.messages ?? 0}개 대화</span>
                          </div>
                          <p className="room-desc">{room.description}</p>
                          <div className="room-meta">
                            <span className="room-last">
                              {room.lastMessage || '첫 대화를 시작해보세요.'}
                            </span>
                            {room.lastMessageAt && (
                              <time>
                                {new Date(room.lastMessageAt).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </time>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="feed">
                    {visiblePosts.map((post) => (
                      <article
                        key={post.id}
                        className="feed-card"
                        onClick={() => navigate(`/post/${post.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="feed-row">
                      {(post.authorPicture || post.imageUrl) && (
                        <div
                          className="avatar"
                          style={{
                            backgroundImage: `url(${post.authorPicture || post.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      )}
                          <div>
                            <p className="feed-author">{post.authorName || post.author?.name || "익명"}</p>
                            <p className="feed-title"><TranslatableText text={post.title} tag="span" /></p>
                          </div>
                        </div>
                        <div className="feed-meta">
                          <span>Comments {post.comments}</span>
                          <span>Likes {post.likes}</span>
                          <span>{post.time}</span>
                          <span className="feed-tag">{post.tag}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </aside>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <Home size={18} />
          <span>{t.nav[0]}</span>
        </NavLink>
        <NavLink to="/boards" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <MessageCircle size={18} />
          <span>{t.nav[1]}</span>
        </NavLink>
        <NavLink to="/board/market" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <ShoppingBag size={18} />
          <span>{t.nav[2]}</span>
        </NavLink>
        <NavLink to="/login" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <User size={18} />
          <span>{t.nav[3]}</span>
        </NavLink>
      </nav>

      {modalItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-kicker">{t.modalTitle}</p>
                <h3>{modalItem.title}</h3>
              </div>
              <button className="icon-button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>{modalItem.detail}</p>
              <div className="modal-meta">
                <span>{modalItem.region}</span>
                <span>{modalItem.type === 'market' ? modalItem.price : modalItem.wage}</span>
                <span>{modalItem.tag}</span>
              </div>
            </div>
            <button
              className="modal-cta"
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                if (modalItem?.id) {
                  navigate(`/post/${modalItem.id}`);
                }
              }}
            >
              {t.modalCta}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;



































