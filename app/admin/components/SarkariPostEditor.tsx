'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AgeLimitRow,
  ApplicationFeeItem,
  CustomLinkItem,
  ImportantDateItem,
  safeJsonParse,
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
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

  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [category, setCategory] = useState(initialPost?.category || 'latest-jobs');
  const [bumpPrimary, setBumpPrimary] = useState(true);
  const [extraCats, setExtraCats] = useState<string[]>(() => {
    const keys = Object.keys(initialCategoryMap || {});
    if (keys.length > 0) return keys;
    return [initialPost?.category || 'latest-jobs'];
  });
  const [catTitles, setCatTitles] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(initialCategoryMap || {})) {
      if (v?.display_title) m[k] = v.display_title;
    }
    return m;
  });

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
      '1. Visit the Official Portal from the Important Links section.\n2. Read the Official Notification PDF carefully before applying.\n3. Upload required Photo, Signature & Certificates and pay exam fee.\n4. Submit final form and print confirmation page.'
  );
  const [articleContent, setArticleContent] = useState(initialPost?.article_content || '');
  const [isFeatured, setIsFeatured] = useState(Boolean(initialPost?.is_featured));
  const [status, setStatus] = useState(initialPost?.status || 'draft');

  // Dynamic Row Builders
  const [dates, setDates] = useState<ImportantDateItem[]>(() =>
    safeJsonParse<ImportantDateItem[]>(initialPost?.important_dates, [{ event: 'Online Application Start', date: '' }])
  );
  const [fees, setFees] = useState<ApplicationFeeItem[]>(() =>
    safeJsonParse<ApplicationFeeItem[]>(initialPost?.application_fee, [{ category: 'General / OBC / EWS', fee: '' }])
  );
  const parsedAge = safeJsonParse<any>(initialPost?.age_limit, {});
  const [ageAsOn, setAgeAsOn] = useState<string>(parsedAge?.as_on || '');
  const [ageRelaxation, setAgeRelaxation] = useState<string>(parsedAge?.relaxation || '');
  const [ageRows, setAgeRows] = useState<AgeLimitRow[]>(() =>
    Array.isArray(parsedAge?.categories) && parsedAge.categories.length > 0
      ? parsedAge.categories
      : [{ category: 'Minimum / Maximum Age', min_age: '', max_age: '' }]
  );
  const [vacancies, setVacancies] = useState<VacancyItem[]>(() =>
    safeJsonParse<VacancyItem[]>(initialPost?.vacancy_details, [])
  );

  const parsedCatTbl = safeJsonParse<any>(initialPost?.category_details, []);
  const [catColumns, setCatColumns] = useState<string[]>(() =>
    parsedCatTbl && !Array.isArray(parsedCatTbl) && Array.isArray(parsedCatTbl.columns)
      ? parsedCatTbl.columns
      : ['Post Name', 'UR', 'EWS', 'OBC', 'SC', 'ST', 'Total']
  );
  const [catRows, setCatRows] = useState<string[][]>(() =>
    parsedCatTbl && !Array.isArray(parsedCatTbl) && Array.isArray(parsedCatTbl.rows) ? parsedCatTbl.rows : []
  );

  const [links, setLinks] = useState<CustomLinkItem[]>(() =>
    safeJsonParse<CustomLinkItem[]>(initialPost?.links, [])
  );

  const [rawHtmlMode, setRawHtmlMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const editorReadyRef = useRef(false);

  // Sync primary category into selected categories automatically
  useEffect(() => {
    setExtraCats((prev) => (prev.includes(category) ? prev : [...prev, category]));
  }, [category]);

  // Load TinyMCE 6 dynamically when not in raw HTML mode
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
        height: 440,
        menubar: true,
        plugins: 'lists link image table code wordcount autoresize',
        toolbar:
          'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | table link image | code',
        setup: (editor: any) => {
          editor.on('init', () => {
            editorReadyRef.current = true;
            editor.setContent(articleContent || '');
          });
          editor.on('change keyup blur', () => {
            setArticleContent(editor.getContent());
          });
        }
      });
    }

    if ((window as any).tinymce) {
      initTiny();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = initTiny;
      document.head.appendChild(script);
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
    const cleanCatRows = catRows.filter((r) => r.some((cell) => cell && cell.trim()));
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
      category_details: cleanCatRows.length > 0 ? { columns: catColumns, rows: cleanCatRows } : [],
      links: cleanLinks,
      is_featured: isFeatured ? 1 : 0,
      status: targetStatus
    };
  }

  async function handleSave(targetStatus: 'draft' | 'active' | 'archived') {
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Post Title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(targetStatus);
      const endpoint = isEdit ? `/api/admin/posts/${initialPost!.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
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
    try {
      localStorage.setItem(
        'cbtrank_sarkari_unsaved_preview',
        JSON.stringify({
          layoutMode: 'blog_2col',
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

  async function handleFileUpload(file: File, onUrl: (url: string) => void) {
    setUploadingAsset(true);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: string };
      if (res.ok && json.success && json.url) {
        onUrl(json.url);
      } else {
        setErrorMsg(json.error || 'Upload failed — paste upload.cbtrank.com URL manually.');
      }
    } catch {
      setErrorMsg('Upload error');
    } finally {
      setUploadingAsset(false);
    }
  }

  return (
    <main className="sarkari-container" style={{ padding: '20px 16px 48px' }}>
      <div className="sarkari-admin-topbar">
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {isEdit ? `✏️ Edit: ${initialPost?.title}` : '➕ Create New Govt Exam / Sarkari Post'}
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
            Save as Draft for human review &amp; Preview before publishing live
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/posts" className="sarkari-btn-secondary">← Back to Posts</Link>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 14px', borderRadius: '6px', marginBottom: '16px', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="sarkari-admin-card" style={{ marginBottom: '18px' }}>
        <div className="sarkari-form-grid">
          <div className="sarkari-form-group" style={{ gridColumn: 'span 2' }}>
            <label>Post Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const v = e.target.value;
                setTitle(v);
                if (!slugTouched) setSlug(slugifyText(v));
              }}
              placeholder="e.g. SSC CGL 2026 Online Form / OPSC ASO Syllabus 2026"
              className="sarkari-input"
              required
            />
          </div>

          <div className="sarkari-form-group">
            <label>Primary Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="sarkari-input">
              {SARKARI_CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{SARKARI_CATEGORIES[k].name}</option>
              ))}
            </select>
          </div>

          <div className="sarkari-form-group" style={{ gridColumn: 'span 2' }}>
            <label>URL Slug (/post/{slug || 'slug'})</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="auto-generated-from-title"
              className="sarkari-input"
            />
          </div>

          <div className="sarkari-form-group">
            <label>Department / Commission</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Staff Selection Commission (SSC)"
              className="sarkari-input"
            />
          </div>

          <div className="sarkari-form-group">
            <label>Post Date / Update Label</label>
            <input
              type="text"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              placeholder="e.g. 28 Nov 2026"
              className="sarkari-input"
            />
          </div>

          <div className="sarkari-form-group">
            <label>Last Date</label>
            <input
              type="text"
              value={lastDate}
              onChange={(e) => setLastDate(e.target.value)}
              placeholder="e.g. 25/12/2026"
              className="sarkari-input"
            />
          </div>

          <div className="sarkari-form-group">
            <label>Total Vacancy Badge</label>
            <input
              type="text"
              value={totalVacancy}
              onChange={(e) => setTotalVacancy(e.target.value)}
              placeholder="e.g. 14,500 Posts"
              className="sarkari-input"
            />
          </div>
        </div>

        <div className="sarkari-form-group">
          <label>Short Information / Overview</label>
          <textarea
            rows={3}
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="Concise summary for SEO meta description & overview box..."
            className="sarkari-input"
          />
        </div>

        {/* Multi-Category History & Preserved Titles */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>🗂️ Category Visibility &amp; Preserved Section Titles</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={bumpPrimary} onChange={(e) => setBumpPrimary(e.target.checked)} />
              <span>Bump primary category to top on save</span>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
            {SARKARI_CATEGORY_KEYS.map((k) => {
              const checked = extraCats.includes(k) || k === category;
              return (
                <div key={k} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={k === category}
                      onChange={(e) => {
                        if (e.target.checked) setExtraCats((prev) => [...prev, k]);
                        else setExtraCats((prev) => prev.filter((item) => item !== k));
                      }}
                    />
                    <span>{SARKARI_CATEGORIES[k].name}</span>
                    {k === category && <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>(Primary)</span>}
                  </label>
                  {checked && (
                    <input
                      type="text"
                      value={catTitles[k] || ''}
                      onChange={(e) => setCatTitles((prev) => ({ ...prev, [k]: e.target.value }))}
                      placeholder="Optional custom title in this category"
                      className="sarkari-input"
                      style={{ marginTop: '6px', fontSize: '0.78rem', padding: '5px 8px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cover Image & External URLs */}
        <div className="sarkari-form-grid">
          <div className="sarkari-form-group" style={{ gridColumn: 'span 2' }}>
            <label>Featured Cover Thumbnail URL (https://upload.cbtrank.com/...)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://upload.cbtrank.com/example.webp"
                className="sarkari-input"
                style={{ flex: '1 1 260px' }}
              />
              <label className="sarkari-btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                {uploadingAsset ? 'Uploading...' : '☁️ Upload Thumbnail'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, setThumbnail);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="sarkari-form-group">
            <label>Apply Online URL</label>
            <input type="url" value={applyOnlineUrl} onChange={(e) => setApplyOnlineUrl(e.target.value)} className="sarkari-input" />
          </div>
          <div className="sarkari-form-group">
            <label>Official Notification PDF URL</label>
            <input type="text" value={notificationPdf} onChange={(e) => setNotificationPdf(e.target.value)} className="sarkari-input" />
          </div>
          <div className="sarkari-form-group">
            <label>Admit Card URL</label>
            <input type="text" value={admitCardUrl} onChange={(e) => setAdmitCardUrl(e.target.value)} className="sarkari-input" />
          </div>
          <div className="sarkari-form-group">
            <label>Result / Scorecard URL</label>
            <input type="text" value={resultUrl} onChange={(e) => setResultUrl(e.target.value)} className="sarkari-input" />
          </div>
          <div className="sarkari-form-group">
            <label>Official Commission Website</label>
            <input type="url" value={officialWebsiteUrl} onChange={(e) => setOfficialWebsiteUrl(e.target.value)} className="sarkari-input" />
          </div>
        </div>
      </div>

      {/* Important Dates & Fees Builders */}
      <div className="sarkari-admin-card" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>📅 Important Dates</h2>
          <button type="button" onClick={() => setDates([...dates, { event: '', date: '' }])} className="sarkari-btn-secondary sarkari-sm">+ Add Date</button>
        </div>
        {dates.map((d, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={d.event}
              onChange={(e) => setDates(dates.map((row, i) => (i === idx ? { ...row, event: e.target.value } : row)))}
              placeholder="Event (e.g. Last Date Apply)"
              className="sarkari-input"
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="text"
              value={d.date}
              onChange={(e) => setDates(dates.map((row, i) => (i === idx ? { ...row, date: e.target.value } : row)))}
              placeholder="Date (e.g. 25/12/2026)"
              className="sarkari-input"
              style={{ flex: '1 1 160px' }}
            />
            <button type="button" onClick={() => setDates(dates.filter((_, i) => i !== idx))} className="sarkari-btn-danger sarkari-sm">✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>💳 Application Fee Details</h2>
          <button type="button" onClick={() => setFees([...fees, { category: '', fee: '' }])} className="sarkari-btn-secondary sarkari-sm">+ Add Fee</button>
        </div>
        {fees.map((f, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={f.category}
              onChange={(e) => setFees(fees.map((row, i) => (i === idx ? { ...row, category: e.target.value } : row)))}
              placeholder="Category (e.g. UR / OBC)"
              className="sarkari-input"
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="text"
              value={f.fee}
              onChange={(e) => setFees(fees.map((row, i) => (i === idx ? { ...row, fee: e.target.value } : row)))}
              placeholder="Fee (e.g. Rs. 100/-)"
              className="sarkari-input"
              style={{ flex: '1 1 160px' }}
            />
            <button type="button" onClick={() => setFees(fees.filter((_, i) => i !== idx))} className="sarkari-btn-danger sarkari-sm">✕</button>
          </div>
        ))}
      </div>

      {/* Age Limit & Vacancies */}
      <div className="sarkari-admin-card" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>👤 Age Limit</h2>
          <button type="button" onClick={() => setAgeRows([...ageRows, { category: '', min_age: '', max_age: '' }])} className="sarkari-btn-secondary sarkari-sm">+ Add Age Row</button>
        </div>
        <div className="sarkari-form-grid" style={{ marginBottom: '10px' }}>
          <input type="text" value={ageAsOn} onChange={(e) => setAgeAsOn(e.target.value)} placeholder="Age as on date (e.g. 01/01/2026)" className="sarkari-input" />
          <input type="text" value={ageRelaxation} onChange={(e) => setAgeRelaxation(e.target.value)} placeholder="Age Relaxation note" className="sarkari-input" />
        </div>
        {ageRows.map((a, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input type="text" value={a.category} onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, category: e.target.value } : r)))} placeholder="Post / Category" className="sarkari-input" style={{ flex: '2 1 180px' }} />
            <input type="text" value={a.min_age} onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, min_age: e.target.value } : r)))} placeholder="Min Age" className="sarkari-input" style={{ flex: '1 1 100px' }} />
            <input type="text" value={a.max_age} onChange={(e) => setAgeRows(ageRows.map((r, i) => (i === idx ? { ...r, max_age: e.target.value } : r)))} placeholder="Max Age" className="sarkari-input" style={{ flex: '1 1 100px' }} />
            <button type="button" onClick={() => setAgeRows(ageRows.filter((_, i) => i !== idx))} className="sarkari-btn-danger sarkari-sm">✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>📋 Vacancy Details</h2>
          <button type="button" onClick={() => setVacancies([...vacancies, { post_name: '', total_post: '', eligibility: '' }])} className="sarkari-btn-secondary sarkari-sm">+ Add Vacancy Row</button>
        </div>
        {vacancies.map((v, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input type="text" value={v.post_name} onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, post_name: e.target.value } : r)))} placeholder="Post Name" className="sarkari-input" style={{ flex: '1 1 180px' }} />
            <input type="text" value={v.total_post} onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, total_post: e.target.value } : r)))} placeholder="Total Posts" className="sarkari-input" style={{ flex: '1 1 110px' }} />
            <input type="text" value={v.eligibility} onChange={(e) => setVacancies(vacancies.map((r, i) => (i === idx ? { ...r, eligibility: e.target.value } : r)))} placeholder="Eligibility" className="sarkari-input" style={{ flex: '2 1 220px' }} />
            <button type="button" onClick={() => setVacancies(vacancies.filter((_, i) => i !== idx))} className="sarkari-btn-danger sarkari-sm">✕</button>
          </div>
        ))}

        {/* Custom Columns Category Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>📊 Category-Wise Table</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={() => { setCatColumns([...catColumns, `Col ${catColumns.length + 1}`]); setCatRows(catRows.map((r) => [...r, ''])); }} className="sarkari-btn-secondary sarkari-sm">+ Col</button>
            <button type="button" onClick={() => setCatRows([...catRows, new Array(catColumns.length).fill('')])} className="sarkari-btn-secondary sarkari-sm">+ Row</button>
          </div>
        </div>
        {catRows.length > 0 && (
          <div className="table-responsive">
            <table className="sarkari-table">
              <thead>
                <tr>
                  {catColumns.map((col, cIdx) => (
                    <th key={cIdx}>
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => setCatColumns(catColumns.map((c, i) => (i === cIdx ? e.target.value : c)))}
                        style={{ width: '100%', padding: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                      />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {catRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {catColumns.map((_, cIdx) => (
                      <td key={cIdx}>
                        <input
                          type="text"
                          value={row[cIdx] || ''}
                          onChange={(e) =>
                            setCatRows(
                              catRows.map((r, ri) =>
                                ri === rIdx ? r.map((cell, ci) => (ci === cIdx ? e.target.value : cell)) : r
                              )
                            )
                          }
                          style={{ width: '100%', padding: '4px', fontSize: '0.82rem' }}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" onClick={() => setCatRows(catRows.filter((_, i) => i !== rIdx))} className="sarkari-btn-danger sarkari-sm">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TinyMCE Full Blog Article + Useful Links */}
      <div className="sarkari-admin-card" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>📝 Full Blog Article (Shown in 2-Column Blog Layout)</h2>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Supports clean headings, tables, lists, FAQs, and HTML</span>
          </div>
          <button
            type="button"
            onClick={() => setRawHtmlMode(!rawHtmlMode)}
            className="sarkari-btn-secondary sarkari-sm"
          >
            {rawHtmlMode ? '🎨 Switch to Visual Editor' : '💻 Switch to HTML Code'}
          </button>
        </div>

        {rawHtmlMode ? (
          <textarea
            rows={14}
            value={articleContent}
            onChange={(e) => setArticleContent(e.target.value)}
            placeholder="<p>Paste or write clean HTML blog article...</p>"
            className="sarkari-input"
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        ) : (
          <textarea
            id="sarkari_article_editor"
            rows={14}
            defaultValue={articleContent}
            className="sarkari-input"
          />
        )}

        <div className="sarkari-form-group" style={{ marginTop: '16px' }}>
          <label>How to Apply Steps (Shown in Classic Layout)</label>
          <textarea rows={4} value={howToApply} onChange={(e) => setHowToApply(e.target.value)} className="sarkari-input" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>🔗 Additional Important Links</h2>
          <button type="button" onClick={() => setLinks([...links, { label: '', url: '', btn_text: 'Click Here' }])} className="sarkari-btn-secondary sarkari-sm">+ Add Link</button>
        </div>
        {links.map((l, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input type="text" value={l.label} onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))} placeholder="Label" className="sarkari-input" style={{ flex: '1 1 180px' }} />
            <input type="url" value={l.url} onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))} placeholder="https://..." className="sarkari-input" style={{ flex: '2 1 220px' }} />
            <input type="text" value={l.btn_text || 'Click Here'} onChange={(e) => setLinks(links.map((r, i) => (i === idx ? { ...r, btn_text: e.target.value } : r)))} placeholder="Button Text" className="sarkari-input" style={{ flex: '1 1 120px' }} />
            <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="sarkari-btn-danger sarkari-sm">✕</button>
          </div>
        ))}
      </div>

      {/* Status & Draft / Preview / Publish Actions */}
      <div className="sarkari-admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span>★ Mark as Featured Post</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.86rem' }}>Current Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="sarkari-input" style={{ width: '160px', padding: '6px 10px' }}>
                <option value="draft">Draft</option>
                <option value="active">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="sarkari-btn-secondary"
            style={{ background: '#f59e0b', borderColor: '#d97706', color: '#ffffff', fontWeight: 700, padding: '10px 20px' }}
          >
            📝 {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleUnsavedPreview}
            className="sarkari-btn-secondary"
            style={{ background: '#0284c7', borderColor: '#0369a1', color: '#ffffff', fontWeight: 700, padding: '10px 20px' }}
          >
            👁️ Preview Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('active')}
            className="sarkari-btn-primary"
            style={{ background: '#16a34a', fontWeight: 700, padding: '10px 22px' }}
          >
            🚀 {isEdit && status === 'active' ? 'Update & Keep Published' : 'Publish Live'}
          </button>
          <Link href="/admin/posts" className="sarkari-btn-secondary">Cancel</Link>
        </div>
      </div>
    </main>
  );
}
