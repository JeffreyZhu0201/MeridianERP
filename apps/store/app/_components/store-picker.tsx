'use client';

/**
 * 商店选择器组件
 *
 * 功能说明:
 * - 消费者在购物前选择要访问的商店页面
 * - 支持搜索商店名称或 slug 快速定位
 * - 自动记住上次访问的商店（30天有效）
 * - 选择商店后跳转到对应的商店页面
 *
 * 使用场景:
 * - 商店前端首页（/s/{slug}）的选择商店界面
 * - 消费者首次访问时选择目标商店
 * - 返回用户快速进入上次访问的商店
 *
 * 组件特性:
 * - 客户端组件，需要用户交互
 * - 自动加载商店列表并显示
 * - 支持实时搜索过滤
 * - 本地存储记住用户选择
 */
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  BentoTile,
  Button,
  EmptyState,
  Input,
  Label,
  Skeleton,
} from '@meridian/ui';
import type { PublishedStore } from '@meridian/shared';

import { apiFetch, type PublishedStoreListResponse } from '@/lib/api';

/** 本地存储的 key，用于记住上次选择的商店 */
const STORAGE_KEY = 'meridian_last_store_slug';
/** 记住选择的有效期：30 天（毫秒） */
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 从本地存储读取上次记住的商店 slug
 *
 * @returns 上次选择的商店 slug，或 null（不存在/已过期）
 *
 * 存储格式:
 * { slug: string, expiresAt: number }
 * - slug: 商店的唯一标识符
 * - expiresAt: 过期时间戳（毫秒）
 *
 * 使用场景:
 * - 组件挂载时检查是否有记住的商店
 * - 如果有且商店列表中存在该商店，默认选中
 */
function readRememberedSlug(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { slug?: string; expiresAt?: number };
    // 检查数据有效性或是否过期
    if (!parsed.slug || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.slug;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * 将选中的商店 slug 存入本地存储
 *
 * @param slug - 要记住的商店 slug
 *
 * 存储内容:
 * - slug: 商店标识
 * - expiresAt: 当前时间 + 30 天
 */
function rememberSlug(slug: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ slug, expiresAt: Date.now() + STORAGE_TTL_MS }),
  );
}

/**
 * 商店选择器组件
 *
 * 核心功能:
 * 1. 加载商店列表
 *    - 组件挂载时从 /store/stores API 获取所有已发布的商店
 *    - 加载完成后检查本地存储是否有上次选择的商店
 *    - 如果有且商店仍在列表中，自动选中
 *
 * 2. 搜索过滤
 *    - 支持按商店显示名称（displayName）或 slug 搜索
 *    - 搜索时实时过滤列表，无需提交
 *
 * 3. 商店选择
 *    - 点击列表项选中商店
 *    - 选中项高亮显示
 *
 * 4. 继续按钮
 *    - 选择商店后点击跳转到对应商店页面
 *    - 跳转前将选择存入本地存储
 *    - 路由: /s/{selectedSlug}
 *
 * 状态说明:
 * - stores: 商店列表数据
 * - query: 搜索框输入值
 * - selectedSlug: 当前选中的商店 slug
 * - loading: 是否正在加载商店列表
 * - error: 加载错误信息
 *
 * 错误处理:
 * - API 调用失败显示错误提示
 * - 无商店时显示空状态
 */
export function StorePicker() {
  const router = useRouter();
  const t = useTranslations('store');
  const [stores, setStores] = useState<PublishedStore[]>([]);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStores() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<PublishedStoreListResponse>('/store/stores');
        if (cancelled) return;
        setStores(response.items);
        const remembered = readRememberedSlug();
        if (remembered && response.items.some((store) => store.slug === remembered)) {
          setSelectedSlug(remembered);
        }
      } catch {
        if (!cancelled) {
          setError(t('home.pickerLoadError'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStores();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredStores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stores;
    return stores.filter(
      (store) =>
        store.displayName.toLowerCase().includes(normalized) ||
        store.slug.toLowerCase().includes(normalized),
    );
  }, [query, stores]);

  function handleContinue() {
    if (!selectedSlug) return;
    rememberSlug(selectedSlug);
    router.push(`/s/${selectedSlug}`);
  }

  if (loading) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </BentoTile>
    );
  }

  if (error) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      </BentoTile>
    );
  }

  if (stores.length === 0) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <EmptyState
          title={t('home.pickerEmpty')}
          description={t('home.pickerEmptyDescription')}
        />
      </BentoTile>
    );
  }

  return (
    <BentoTile colSpan={2} className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-search">{t('home.pickerLabel')}</Label>
          <Input
            id="store-search"
            type="search"
            placeholder={t('home.pickerPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div
          className="max-h-64 overflow-y-auto rounded-lg ring-1 ring-border"
          role="listbox"
          aria-label={t('home.pickerLabel')}
        >
          {filteredStores.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('home.pickerEmpty')}
            </p>
          ) : (
            filteredStores.map((store) => {
              const selected = store.slug === selectedSlug;
              return (
                <button
                  key={store.slug}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedSlug(store.slug)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/60 ${
                    selected ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <span>{store.displayName}</span>
                  <span className="font-mono text-xs text-muted-foreground">/s/{store.slug}</span>
                </button>
              );
            })
          )}
        </div>

        <Button type="button" className="w-full" disabled={!selectedSlug} onClick={handleContinue}>
          {t('home.pickerContinue')}
        </Button>
      </div>
    </BentoTile>
  );
}
