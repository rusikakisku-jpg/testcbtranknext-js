'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from './AdminConsoleShell';
import {
  AgeLimitRow,
  ApplicationFeeItem,
  CustomLinkItem,
  ImportantDateItem,
  safeJsonParse,
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariAuthor,
  SarkariPost,
  slugifyText,
  VacancyItem
} from '../../lib/sarkariConstants';

interface SarkariPostEditorProps {
  initialPost?: SarkariPost | null;
  initialCategoryMap?: Record<string, { category: string; display_title: string; bumped_at: string }>;
}

export default function SarkariPostEditor({
  initialPost = null,
  initialCategoryMap = {}
}: SarkariPostEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(initialPost?.id);
  const initialPrimaryCat = initialPost?.category || 'latest-jobs';

  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [category, setCategory] = useState(initialPrimaryCat);
  const [bumpPrimary, setBumpPrimary] = useState(false);

  const [extraCats, setExtraCats] = useState<string[]>(() => {
    const keys = Object.keys(initialCategoryMap || {});
    if (keys.length > 0) return keys;
    return [initialPrimaryCat];
  });
  const [catTitles, setCatTitles] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(initialCategoryMap || {})) {
      if (v?.display_title) m[k] = v.display_title;
    }
    if (isEdit && initialPost?.title && !m[initialPrimaryCat]) {
      m[initialPrimaryCat] = initialPost.title;
    }
    return m;
  });
  const manualCatTitleRef = useRef<Set<string>>(new Set());

  const [department, setDepartment] = useState(initialPost?.department || '');
  const [postDate, setPostDate] = useState(initialPost?.post_date || '');
  const [lastDate, setLastDate] = useState(initialPost?.last_date || '');
  const [shortDesc, setShortDesc] = useState(initialPost?.short_desc || '');
  const [totalVacancy, setTotalVacancy] = useState(initialPost?.total_vacancy || '');
  const [thumbnail, setThumbnail] = useState(initialPost?.thumbnail || '');
  const [notificationPdf, setNotificationPdf] = useState(initialPost?.notification_pdf || '');
  const [admitCardUrl, setAdmitCardUrl] = useState(initialPost?.admit_card_url || '');
  const [resultUrl, setResultUrl] = useState(initialPost?.result_url || '');
  const [applyOnlineUrl, setApplyOnlineUrl] = useState(initialPost?.apply_online_url || '');
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState(initialPost?.official_website_url || '');
  const [howToApply, setHowToApply] = useState(
    initialPost?.how_to_apply ||
      '1. Candidate Can Apply Online From Official Portal.\n2. Read Notification Carefully Before Filling Form.\n3. Keep Ready Photo, Sign & ID Proof.\n4. Pay Exam Fee and Print Final Application Form.'
  );
  const [articleContent, setArticleContent] = useState(initialPost?.article_content || '');
  const [authorId, setAuthorId] = useState<number>(initialPost?.author_id || 1);
  const [authors, setAuthors] = useState<SarkariAuthor[]>([
    { id: 1, name: 'Mangal', slug: 'mangal', role: 'Senior Recruitment Analyst & Fact-Checker Lead' }
  ]);
  const [activeLayoutSetting, setActiveLayoutSetting] = useState<'blog_2col' | 'classic'>('blog_2col');
  const [isFeatured, setIsFeatured] = useState(Boolean(initialPost?.is_featured));
  const [status, setStatus] = useState(initialPost?.status || 'draft');

  // Dynamic Row Builders with exact GovtExamZone Defaults on New Post
  const [dates, setDates] = useState<ImportantDateItem[]>(() => {
    const parsed = safeJsonParse<ImportantDateItem[]>(initialPost?.important_dates, []);
    if (parsed.length > 0) return parsed;
    if (!initialPost) {
      return [
        { event: 'Application Begin', date: '' },
        { event: 'Last Date for Apply Online', date: '' },
        { event: 'Pay Exam Fee Last Date', date: '' },
        { event: 'Exam Date', date: 'As per Schedule' },
        { event: 'Admit Card Available', date: 'Before Exam' }
      ];
    }
    return [];
  });

  const [fees, setFees] = useState<ApplicationFeeItem[]>(() => {
    const parsed = safeJsonParse<ApplicationFeeItem[]>(initialPost?.application_fee, []);
    if (parsed.length > 0) return parsed;
    if (!initialPost) {
      return [
        { category: 'General / OBC / EWS', fee: '' },
        { category: 'SC / ST / PH', fee: '' },
        { category: 'Payment Mode', fee: 'Online Debit Card, Credit Card, Net Banking or UPI' }
      ];
    }
    return [];
  });

  const parsedAge = safeJsonParse<any>(initialPost?.age_limit, {});
  const [ageAsOn, setAgeAsOn] = useState<string>(parsedAge?.as_on || '');
  const [ageRelaxation, setAgeRelaxation] = useState<string>(parsedAge?.relaxation || '');
  const [ageRows, setAgeRows] = useState<AgeLimitRow[]>(() => {
    if (Array.isArray(parsedAge?.categories) && parsedAge.categories.length > 0) {
      return parsedAge.categories;
    }
    if (parsedAge?.min_age || parsedAge?.max_age) {
      return [{ category: 'General / All Categories', min_age: parsedAge.min_age || '', max_age: parsedAge.max_age || '' }];
    }
    if (!initialPost) {
      return [
        { category: 'General / UR', min_age: '', max_age: '' },
        { category: 'OBC', min_age: '', max_age: '' },
        { category: 'SC / ST', min_age: '', max_age: '' }
      ];
    }
    return [{ category: 'General / UR', min_age: '', max_age: '' }];
  });

  const [vacancies, setVacancies] = useState<VacancyItem[]>(() => {
    const parsed = safeJsonParse<VacancyItem[]>(initialPost?.vacancy_details, []);
    if (parsed.length > 0) return parsed;
    return [{ post_name: '', total_post: '', eligibility: '' }];
  });

  const parsedCatTbl = safeJsonParse<any>(initialPost?.category_details, []);
  const [catColumns, setCatColumns] = useState<string[]>(() => {
    if (parsedCatTbl && !Array.isArray(parsedCatTbl) && Array.isArray(parsedCatTbl.columns) && parsedCatTbl.columns.length > 0) {
      return parsedCatTbl.columns.map((c: unknown) => String(c || ''));
    }
    return ['Post / Group Name', 'UR / Gen', 'EWS', 'OBC', 'SC', 'ST', 'Total'];
  });

  const [catRows, setCatRows] = useState<string[][]>(() => {
    if (parsedCatTbl && !Array.isArray(parsedCatTbl) && Array.isArray(parsedCatTbl.rows) && parsedCatTbl.rows.length > 0) {
      return parsedCatTbl.rows;
    }
    if (Array.isArray(parsedCatTbl) && parsedCatTbl.length > 0) {
      return parsedCatTbl.map((c: any) => [
        c.post_name || '',
        c.ur || '',
        c.ews || '',
        c.obc || '',
        c.sc || '',
        c.st || '',
        c.total || ''
      ]);
    }
    return [new Array(7).fill('')];
  });

  const [links, setLinks] = useState<CustomLinkItem[]>(() => {
    const parsed = safeJsonParse<CustomLinkItem[]>(initialPost?.links, []);
    if (parsed.length > 0) return parsed;
    if (!initialPost) {
      return [
        { label: 'Apply Online', url: '', btn_text: 'Click Here' },
        { label: 'Download Notification', url: '', btn_text: 'Click Here' },
        { label: 'Official Website', url: '', btn_text: 'Click Here' }
      ];
    }
    return [];
  });

  const [rawHtmlMode, setRawHtmlMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const editorReadyRef = useRef(false);

  // Load authors list & active layout setting
  useEffect(() => {
    fetch('/api/admin/authors', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: any) => {
        if (Array.isArray(json?.authors) && json.authors.length > 0) {
          setAuthors(json.authors);
        }
      })
      .catch(() => {});

    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: any) => {
        if (json?.settings?.post_detail_layout === 'classic') {
          setActiveLayoutSetting('classic');
        }
      })
      .catch(() => {});
  }, []);

  // Category History & Preserved Section Titles sync
  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugTouched) setSlug(slugifyText(nextTitle));
    if (!manualCatTitleRef.current.has(category)) {
      setCatTitles((prev) => ({ ...prev, [category]: nextTitle }));
    }
  };

  const handlePrimaryCategoryChange = (nextCat: string) => {
    const prevCat = category;
    if (prevCat === nextCat) return;

    setCategory(nextCat);
    setExtraCats((prev) => Array.from(new Set([...prev, prevCat, nextCat])));

    // Preserve previous category saved title if edit mode & not manually modified
    const savedPrevTitle = initialCategoryMap?.[prevCat]?.display_title || '';
    if (savedPrevTitle && !manualCatTitleRef.current.has(prevCat)) {
      setCatTitles((prev) => ({ ...prev, [prevCat]: savedPrevTitle }));
    }

    // Set next primary title unless manually customized
    if (!manualCatTitleRef.current.has(nextCat)) {
      setCatTitles((prev) => ({ ...prev, [nextCat]: title }));
    }

    if (isEdit && nextCat !== initialPrimaryCat) {
      setBumpPrimary(true);
    }
  };

  // Load TinyMCE 6 WYSIWYG Rich Editor (matching GovtExamZone toolbar + R2 upload)
  useEffect(() => {
    if (rawHtmlMode) {
      const ed = (window as any).tinymce?.get?.('sarkari_article_editor');
      if (ed) {
        try {
          setArticleContent(ed.getContent());
          ed.remove();
        } catch {}
      }
      editorReadyRef.current = false;
      return;
    }

    let cancelled = false;
    function initTiny() {
      const tmce = (window as any).tinymce;
      if (!tmce || cancelled) return;
      if (tmce.get('sarkari_article_editor')) {
        tmce.get('sarkari_article_editor').remove();
      }
      tmce.init({
        selector: '#sarkari_article_editor',
        height: typeof window !== 'undefined' && window.innerWidth <= 768 ? 320 : 450,
        menubar: false,
        toolbar_mode: 'sliding',
        plugins:
          'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table link image code | removeformat preview fullscreen',
        content_style:
          'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; color: #334155; line-height: 1.7; padding: 14px; } h2, h3 { color: #0f172a; margin-top: 18px; margin-bottom: 8px; } table { width: 100%; border-collapse: collapse; margin: 14px 0; } th, td { border: 1px solid #93c5fd; padding: 8px 12px; } th { background: #f0f7ff; color: #1e40af; } blockquote { border-left: 4px solid #0066ff; padding-left: 14px; color: #334155; background: #f8fafc; padding: 10px 14px; } a { color: #0066ff; }',
        automatic_uploads: true,
        images_upload_handler: (blobInfo: any) =>
          new Promise((resolve, reject) => {
            const fd = new FormData();
            fd.append('file', blobInfo.blob(), blobInfo.filename());
            fetch('/api/admin/upload', { method: 'POST', body: fd })
              .then((res) => res.json())
              .then((data: any) => {
                if (data?.url) resolve(data.url);
                else if (data?.location) resolve(data.location);
                else reject(data?.error || 'Image upload failed');
              })
              .catch((err: any) => reject('Upload error: ' + (err?.message || 'failed')));
          }),
        setup: (editor: any) => {
          editor.on('init', () => {
            editorReadyRef.current = true;
            editor.setContent(articleContent || '');
          });
          editor.on('change keyup input blur', () => {
            setArticleContent(editor.getContent());
          });
        }
      });
    }

    if ((window as any).tinymce) {
      initTiny();
    } else {
      const existing = document.getElementById('gez-tinymce-cdn') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', initTiny, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = 'gez-tinymce-cdn';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
        script.referrerPolicy = 'origin';
        script.onload = initTiny;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      const ed = (window as any).tinymce?.get?.('sarkari_article_editor');
      if (ed) {
        try {
          ed.remove();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawHtmlMode]);

  function getLatestArticleHtml(): string {
    if (!rawHtmlMode) {
      const ed = (window as any).tinymce?.get?.('sarkari_article_editor');
      if (ed) {
        try {
          return ed.getContent();
        } catch {}
      }
    }
    return articleContent;
  }

  function buildPayload(targetStatus: 'draft' | 'active' | 'archived') {
    const cleanDates = dates.filter((d) => d.event.trim() || d.date.trim());
    const cleanFees = fees.filter((f) => f.category.trim() || f.fee.trim());
    const cleanAgeRows = ageRows.filter((a) => a.min_age.trim() || a.max_age.trim());
    const cleanVacancies = vacancies.filter((v) => v.post_name.trim() || v.total_post.trim() || v.eligibility.trim());
    const cleanCols = catColumns.map((c, idx) => (c || '').trim() || `Column ${idx + 1}`);
    const cleanCatRows = catRows
      .map((r) => {
        const row = r.slice(0, cleanCols.length);
        while (row.length < cleanCols.length) row.push('');
        return row.map((cell) => (cell || '').trim());
      })
      .filter((r) => r.some((cell) => cell.length > 0));
    const cleanLinks = links.filter((l) => l.label.trim() || l.url.trim());

    return {
      title: title.trim(),
      slug: (slug || slugifyText(title)).trim(),
      category,
      extra_categories: Array.from(new Set([...extraCats, category])),
      category_titles: catTitles,
      bump_primary: bumpPrimary,
      department: department.trim(),
      post_date: postDate.trim(),
      last_date: lastDate.trim(),
      short_desc: shortDesc.trim(),
      total_vacancy: totalVacancy.trim(),
      thumbnail: thumbnail.trim(),
      notification_pdf: notificationPdf.trim(),
      admit_card_url: admitCardUrl.trim(),
      result_url: resultUrl.trim(),
      apply_online_url: applyOnlineUrl.trim(),
      official_website_url: officialWebsiteUrl.trim(),
      how_to_apply: howToApply,
      article_content: getLatestArticleHtml(),
      important_dates: cleanDates,
      application_fee: cleanFees,
      age_limit:
        ageAsOn || ageRelaxation || cleanAgeRows.length > 0
          ? { as_on: ageAsOn.trim(), relaxation: ageRelaxation.trim(), categories: cleanAgeRows }
          : {},
      vacancy_details: cleanVacancies,
      category_details: cleanCatRows.length > 0 ? { columns: cleanCols, rows: cleanCatRows } : [],
      links: cleanLinks,
      is_featured: isFeatured ? 1 : 0,
      status: targetStatus,
      author_id: authorId
    };
  }

  async function handleSave(targetStatus: 'draft' | 'active' | 'archived') {
    if (!title.trim()) {
      setErrorMsg('Post Title is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const payload = buildPayload(targetStatus);
      const endpoint = isEdit ? `/api/admin/posts/${initialPost!.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Failed to save post');
        setSaving(false);
        return;
      }
      router.push('/admin/posts');
      router.refresh();
    } catch {
      setErrorMsg('Network error while saving post');
      setSaving(false);
    }
  }

  function handleUnsavedPreview() {
    const payload = buildPayload(status as 'draft' | 'active' | 'archived');
    const selectedAuthor = authors.find((a) => a.id === authorId);
    try {
      localStorage.setItem(
        'cbtrank_sarkari_unsaved_preview',
        JSON.stringify({
          layoutMode: activeLayoutSetting,
          authorName: selectedAuthor?.name || 'Mangal',
          post: {
            id: initialPost?.id || 0,
            ...payload,
            important_dates: JSON.stringify(payload.important_dates),
            application_fee: JSON.stringify(payload.application_fee),
            age_limit: JSON.stringify(payload.age_limit),
            vacancy_details: JSON.stringify(payload.vacancy_details),
            category_details: JSON.stringify(payload.category_details),
            links: JSON.stringify(payload.links)
          }
        })
      );
      window.open('/admin/preview', '_blank');
    } catch {}
  }

  async function handleFileUpload(file: File, fieldKey: string, onUrl: (url: string) => void) {
    setUploadingField(fieldKey);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: string };
      if (res.ok && json.success && json.url) {
        onUrl(json.url);
      } else {
        setErrorMsg(json.error || 'R2 upload failed — paste upload.cbtrank.com URL directly or attach R2 binding.');
      }
    } catch {
      setErrorMsg('Upload error');
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <AdminConsoleShell pageTitle={isEdit ? 'Edit Notification' : 'Create Notification'}>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>{isEdit ? `Edit Notification: ${initialPost?.title}` : 'Create New Sarkari Notification'}</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Complete GovtExamZone editor — Save as Draft for human review &amp; Preview before publishing live
            </div>
          </div>
          <Link href="/admin/posts" className="btn btn-secondary btn-sm">← Back to Posts</Link>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Row 1: Title & Category */}
        <div className="form-row">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="title">Post Title *</label>
            <input
              id="title"
              type="text"
              className="form-control"
              placeholder="e.g. SSC CGL 2026 Online Form Apply Online"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
            >
              {SARKARI_CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{SARKARI_CATEGORIES[k].name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category History & Multi-Section Appearances (GovtExamZone exact panel) */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                📌 Category History &amp; Section Titles (Same Slug Across All Stages)
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Jab aap Category change karenge (e.g. <b>Latest Jobs → Admit Card → Result</b>), purani category aur uska purana title automatically preserve rahega aur URL slug same rahega.
              </div>
            </div>
            {isEdit && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1d4ed8', background: '#eff6ff', padding: '5px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', cursor: 'pointer' }}>
                <input type="checkbox" checked={bumpPrimary} onChange={(e) => setBumpPrimary(e.target.checked)} />
                <span>🔝 Bump Primary Category to Top</span>
              </label>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
            {SARKARI_CATEGORY_KEYS.map((catKey) => {
              const isPrimary = category === catKey;
              const isPreserved = Boolean(initialCategoryMap?.[catKey]) && !isPrimary;
              const isChecked = isPrimary || extraCats.includes(catKey);
              return (
                <div
                  key={catKey}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${isPrimary ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPrimary}
                        onChange={(e) => {
                          if (e.target.checked) setExtraCats((prev) => Array.from(new Set([...prev, catKey])));
                          else setExtraCats((prev) => prev.filter((item) => item !== catKey));
                        }}
                      />
                      <span>{SARKARI_CATEGORIES[catKey].name}</span>
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: isPrimary ? '#dbeafe' : isPreserved ? '#dcfce7' : '#f1f5f9',
                        color: isPrimary ? '#1d4ed8' : isPreserved ? '#15803d' : '#64748b'
                      }}
                    >
                      {isPrimary ? 'Primary' : isPreserved ? 'Preserved' : 'Optional'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                    value={catTitles[catKey] || ''}
                    placeholder="Section title (defaults to Post Title)"
                    onChange={(e) => {
                      manualCatTitleRef.current.add(catKey);
                      setCatTitles((prev) => ({ ...prev, [catKey]: e.target.value }));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2: Department, Post Date, Last Date */}
        <div className="form-row">
          <div className="form-group">
            <label>Department / Board</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Staff Selection Commission (SSC)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Post Date / Update Text</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 28 November 2026 | 10:15 AM"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Last Date</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 25/12/2026"
              value={lastDate}
              onChange={(e) => setLastDate(e.target.value)}
            />
          </div>
        </div>

        {/* Short Description */}
        <div className="form-group">
          <label>Short Information</label>
          <textarea
            rows={3}
            className="form-control"
            placeholder="Brief overview of recruitment or exam results..."
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
          />
        </div>

        {/* Total Vacancies & Slug */}
        <div className="form-row">
          <div className="form-group">
            <label>Total Vacancies Badge</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 17,727 Posts"
              value={totalVacancy}
              onChange={(e) => setTotalVacancy(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Custom URL Slug (/post/{slug || 'slug'})</label>
            <input
              type="text"
              className="form-control"
              placeholder="ssc-cgl-2026-online-form"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Post Thumbnail / Featured Image Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>🖼️ Post Thumbnail / Featured Image (Optional)</h3>
              <small style={{ color: '#64748b' }}>Displayed on the post page &amp; used for WhatsApp/Telegram/Google social share previews</small>
            </div>
            <button
              type="button"
              onClick={() => setThumbnail('')}
              className="btn btn-sm"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: '11.5px', fontWeight: 600 }}
            >
              🗑️ Remove Thumbnail
            </button>
          </div>
          <div className="form-row" style={{ alignItems: 'center' }}>
            <div className="form-group" style={{ maxWidth: '160px', marginBottom: 0 }}>
              <div style={{ width: '140px', height: '84px', background: '#ffffff', border: '1px dashed #94a3b8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center' }}>
                {thumbnail.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbnail.trim()} alt="Post Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>No Thumbnail</span>
                )}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px', color: '#475569' }}>
                Upload Thumbnail Image (to R2) {uploadingField === 'thumb' ? '⏳ Uploading...' : ''}
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ padding: '6px' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, 'thumb', setThumbnail);
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px', color: '#475569' }}>Or Paste Thumbnail Image URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://upload.cbtrank.com/..."
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cloudflare R2 Document Upload & Link Green Section */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <h3 style={{ color: '#166534', fontSize: '15px', marginTop: 0, marginBottom: '12px' }}>
            ☁️ Documents &amp; External Links (R2 File Upload or Direct Web URL)
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label>Notification PDF (URL or File)</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://... or R2 URL"
                value={notificationPdf}
                onChange={(e) => setNotificationPdf(e.target.value)}
              />
              <div style={{ marginTop: '6px' }}>
                <small style={{ color: '#475569', fontSize: '11.5px' }}>
                  Or Upload PDF/Doc to R2: {uploadingField === 'pdf' ? '⏳ Uploading...' : ''}
                </small>
                <input
                  type="file"
                  className="form-control"
                  style={{ marginTop: '2px', padding: '6px' }}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'pdf', setNotificationPdf);
                  }}
                />
              </div>
              {notificationPdf && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#166534' }}>
                  Active File/URL: <a href={notificationPdf} target="_blank" rel="noreferrer">View Notification</a>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Admit Card (URL or File)</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://..."
                value={admitCardUrl}
                onChange={(e) => setAdmitCardUrl(e.target.value)}
              />
              <div style={{ marginTop: '6px' }}>
                <small style={{ color: '#475569', fontSize: '11.5px' }}>
                  Or Upload Admit Card to R2: {uploadingField === 'admit' ? '⏳ Uploading...' : ''}
                </small>
                <input
                  type="file"
                  className="form-control"
                  style={{ marginTop: '2px', padding: '6px' }}
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'admit', setAdmitCardUrl);
                  }}
                />
              </div>
              {admitCardUrl && (
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Active File/URL: <a href={admitCardUrl} target="_blank" rel="noreferrer">View Admit Card</a>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Result (URL or File)</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://..."
                value={resultUrl}
                onChange={(e) => setResultUrl(e.target.value)}
              />
              <div style={{ marginTop: '6px' }}>
                <small style={{ color: '#475569', fontSize: '11.5px' }}>
                  Or Upload Result to R2: {uploadingField === 'result' ? '⏳ Uploading...' : ''}
                </small>
                <input
                  type="file"
                  className="form-control"
                  style={{ marginTop: '2px', padding: '6px' }}
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'result', setResultUrl);
                  }}
                />
              </div>
              {resultUrl && (
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Active File/URL: <a href={resultUrl} target="_blank" rel="noreferrer">View Result</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visual Interactive Builder: Important Dates */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>📅 Important Dates Schedule</h3>
            <button type="button" onClick={() => setDates([...dates, { event: '', date: '' }])} className="btn btn-secondary btn-sm">+ Add Date Row</button>
          </div>
          {dates.map((d, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 200px' }}
                placeholder="Event (e.g. Application Begin)"
                value={d.event}
                onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, event: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 180px' }}
                placeholder="Date (e.g. 25/12/2026)"
                value={d.date}
                onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r)))}
              />
              <button type="button" onClick={() => setDates(dates.filter((_, i) => i !== idx))} className="btn btn-danger btn-sm">✕</button>
            </div>
          ))}
        </div>

        {/* Visual Interactive Builder: Application Fee */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>💳 Application Fee Details</h3>
            <button type="button" onClick={() => setFees([...fees, { category: '', fee: '' }])} className="btn btn-secondary btn-sm">+ Add Fee Row</button>
          </div>
          {fees.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 200px' }}
                placeholder="Category (e.g. General / OBC / EWS)"
                value={f.category}
                onChange={(e) => setFees(fees.map((r, i) => (i === idx ? { ...r, category: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 180px' }}
                placeholder="Fee Amount (e.g. ₹ 100/-)"
                value={f.fee}
                onChange={(e) => setFees(fees.map((r, i) => (i === idx ? { ...r, fee: e.target.value } : r)))}
              />
              <button type="button" onClick={() => setFees(fees.filter((_, i) => i !== idx))} className="btn btn-danger btn-sm">✕</button>
            </div>
          ))}
        </div>

        {/* Visual Interactive Builder: Vacancy Details & Eligibility */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>📋 Vacancy Details &amp; Eligibility</h3>
            <button type="button" onClick={() => setVacancies([...vacancies, { post_name: '', total_post: '', eligibility: '' }])} className="btn btn-secondary btn-sm">+ Add Vacancy Row</button>
          </div>
          {vacancies.map((v, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: '1.5 1 180px' }}
                placeholder="Post Name"
                value={v.post_name}
                onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, post_name: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 110px' }}
                placeholder="Total Posts"
                value={v.total_post}
                onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, total_post: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '2 1 220px' }}
                placeholder="Eligibility Criteria"
                value={v.eligibility}
                onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, eligibility: e.target.value } : r)))}
              />
              <button type="button" onClick={() => setVacancies(vacancies.filter((_, i) => i !== idx))} className="btn btn-danger btn-sm">✕</button>
            </div>
          ))}
        </div>

        {/* Visual Interactive Builder: Category-Wise Vacancy Distribution (Dynamic Rows & Columns) */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>📊 Category-Wise Vacancy Distribution</h3>
              <small style={{ color: '#64748b' }}>Create unlimited rows &amp; columns — rename, add, or remove any column header or row</small>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setCatColumns([...catColumns, `Col ${catColumns.length + 1}`]);
                  setCatRows(catRows.map((r) => [...r, '']));
                }}
                className="btn btn-secondary btn-sm"
              >
                + Add Column
              </button>
              <button
                type="button"
                onClick={() => setCatRows([...catRows, new Array(catColumns.length).fill('')])}
                className="btn btn-primary btn-sm"
              >
                + Add Row
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', minWidth: `${Math.max(420, catColumns.length * 115 + 50)}px` }}>
              <thead>
                <tr>
                  {catColumns.map((col, colIdx) => (
                    <th key={colIdx} style={{ padding: '2px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontWeight: 700, fontSize: '12px', background: '#eff6ff', borderColor: '#93c5fd', padding: '6px 8px' }}
                          value={col}
                          placeholder={`Col ${colIdx + 1}`}
                          onChange={(e) => setCatColumns(catColumns.map((c, i) => (i === colIdx ? e.target.value : c)))}
                        />
                        {catColumns.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 7px', fontSize: '11px', flexShrink: 0 }}
                            title="Remove column"
                            onClick={() => {
                              setCatColumns(catColumns.filter((_, i) => i !== colIdx));
                              setCatRows(catRows.map((r) => r.filter((_, i) => i !== colIdx)));
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{ width: '38px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>Row</th>
                </tr>
              </thead>
              <tbody>
                {catRows.map((rowVals, rowIdx) => (
                  <tr key={rowIdx}>
                    {catColumns.map((col, colIdx) => (
                      <td key={colIdx} style={{ padding: '2px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={col || 'Value'}
                          value={rowVals[colIdx] || ''}
                          onChange={(e) =>
                            setCatRows(
                              catRows.map((r, rI) =>
                                rI === rowIdx
                                  ? catColumns.map((_, cI) => (cI === colIdx ? e.target.value : r[cI] || ''))
                                  : r
                              )
                            )
                          }
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', padding: '2px' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 10px' }}
                        onClick={() => {
                          const next = catRows.filter((_, i) => i !== rowIdx);
                          setCatRows(next.length > 0 ? next : [new Array(catColumns.length).fill('')]);
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Interactive Builder: Age Limit Details */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>👤 Age Limit Details (Category-Wise)</h3>
              <small style={{ color: '#64748b' }}>Add category-wise Minimum &amp; Maximum age limit rows</small>
            </div>
            <button type="button" onClick={() => setAgeRows([...ageRows, { category: '', min_age: '', max_age: '' }])} className="btn btn-secondary btn-sm">+ Add Age Row</button>
          </div>
          <div className="form-row" style={{ marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Age Limit (As on Date)</label>
              <input type="text" className="form-control" placeholder="e.g. 01/08/2026" value={ageAsOn} onChange={(e) => setAgeAsOn(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Extra Age Relaxation Note (Optional)</label>
              <input type="text" className="form-control" placeholder="e.g. Age Relaxation Extra as per Rules" value={ageRelaxation} onChange={(e) => setAgeRelaxation(e.target.value)} />
            </div>
          </div>
          {ageRows.map((a, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: '2 1 180px' }}
                placeholder="Category (e.g. General / UR, OBC, SC / ST)"
                value={a.category}
                onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, category: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 120px' }}
                placeholder="Min Age (e.g. 18 Years)"
                value={a.min_age}
                onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, min_age: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 120px' }}
                placeholder="Max Age (e.g. 27 Years)"
                value={a.max_age}
                onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, max_age: e.target.value } : r)))}
              />
              <button type="button" onClick={() => setAgeRows(ageRows.filter((_, i) => i !== idx))} className="btn btn-danger btn-sm">✕</button>
            </div>
          ))}
        </div>

        {/* How to Apply */}
        <div className="form-group">
          <label>How to Apply Steps</label>
          <textarea rows={4} className="form-control" value={howToApply} onChange={(e) => setHowToApply(e.target.value)} />
        </div>

        {/* Full Blog Article / TinyMCE 6 Rich Text Editor (Blue Card) */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <label style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0369a1' }}>
                📝 Full Blog Article / TinyMCE Editor (Optional)
              </label>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Write your full blog post visually with tables, headings, links, images (auto-upload to R2) &amp; FAQs — displayed in <strong>2-Column Blog + Sidebar Layout</strong>!
              </div>
            </div>
            <button type="button" onClick={() => setRawHtmlMode(!rawHtmlMode)} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              {rawHtmlMode ? '🎨 Visual Editor' : '💻 HTML Code'}
            </button>
          </div>
          {rawHtmlMode ? (
            <textarea
              rows={14}
              className="form-control"
              style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
              placeholder="Write full blog article HTML content here..."
            />
          ) : (
            <textarea id="sarkari_article_editor" rows={14} className="form-control" defaultValue={articleContent} />
          )}
        </div>

        {/* Useful Important Links Builder */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>🔗 Some Useful Important Links (Custom Links Table)</h3>
              <small style={{ color: '#64748b' }}>Add custom download links, Server 1 / Server 2, answer key, mock test, syllabus, etc.</small>
            </div>
            <button type="button" onClick={() => setLinks([...links, { label: '', url: '', btn_text: 'Click Here' }])} className="btn btn-secondary btn-sm">+ Add Link Row</button>
          </div>
          {links.map((l, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: '1.5 1 180px' }}
                placeholder="Link Title (e.g. Apply Online)"
                value={l.label}
                onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '2 1 220px' }}
                placeholder="URL (https://...)"
                value={l.url}
                onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))}
              />
              <input
                type="text"
                className="form-control"
                style={{ flex: '1 1 120px' }}
                placeholder="Button Text"
                value={l.btn_text || 'Click Here'}
                onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, btn_text: e.target.value } : r)))}
              />
              <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="btn btn-danger btn-sm">✕</button>
            </div>
          ))}
        </div>

        {/* Direct External Links */}
        <div className="form-row">
          <div className="form-group">
            <label>Apply Online URL</label>
            <input type="url" className="form-control" placeholder="https://ssc.gov.in" value={applyOnlineUrl} onChange={(e) => setApplyOnlineUrl(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Official Website URL</label>
            <input type="url" className="form-control" placeholder="https://ssc.gov.in" value={officialWebsiteUrl} onChange={(e) => setOfficialWebsiteUrl(e.target.value)} />
          </div>
        </div>

        {/* Assigned Author, Publication Status & Featured Checkbox */}
        <div className="form-row" style={{ alignItems: 'center', marginTop: '10px' }}>
          <div className="form-group">
            <label>Assigned Author / Fact-Checker *</label>
            <select className="form-control" value={authorId} onChange={(e) => setAuthorId(Number(e.target.value) || 1)}>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role || 'Editor'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Publication Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Draft (Review Before Publish)</option>
              <option value="active">Published (Active Live)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group" style={{ paddingTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span>Mark as Featured Post</span>
            </label>
          </div>
        </div>

        {/* Exact GovtExamZone Draft / Preview / Publish Action Buttons */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="btn btn-secondary"
            style={{ background: '#f59e0b', borderColor: '#d97706', color: '#ffffff', fontSize: '15px', padding: '10px 20px', fontWeight: 700 }}
          >
            📝 {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleUnsavedPreview}
            className="btn btn-secondary"
            style={{ background: '#0284c7', borderColor: '#0369a1', color: '#ffffff', fontSize: '15px', padding: '10px 20px', fontWeight: 700 }}
          >
            👁️ Preview Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('active')}
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#15803d', fontSize: '15px', padding: '10px 22px', fontWeight: 700 }}
          >
            🚀 {isEdit && status === 'active' ? 'Update & Keep Published' : 'Publish Live'}
          </button>
          <Link href="/admin/posts" className="btn btn-secondary">Cancel</Link>
        </div>
      </div>
    </AdminConsoleShell>
  );
}
