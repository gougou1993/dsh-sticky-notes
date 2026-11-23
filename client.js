/**
 * Client half of the sticky notes bundle.
 *
 * Registers one left sidebar icon (sidebar.panellist) and a matching central
 * panel (main, keyed by PANEL_ID). Notes are plain records kept in
 * localStorage; rendering uses React elements only, so note text is never
 * interpreted as HTML.
 */
window.__ModuleLoader__.load({
  id: '@oakzhong/dsh-sticky-notes',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const NS = 'dsh-sticky-notes'
    const PANEL_ID = 'sticky-notes'
    const STYLE_ID = 'dsh-sticky-notes/css'
    const STORAGE_KEY = 'dsh-sticky-notes.notes.v1'

    // Colors are artwork for the notes themselves; text always uses host tokens.
    const COLORS = ['#ffd75e', '#ff9fb2', '#9be7c4', '#9fd0ff', '#ffbf87', '#cbb6ff']

    const zh = {
      title: '便利贴',
      subtitle: '随手记下想法，自动保存在本机。',
      add: '新建便利贴',
      addHint: '添加一张便利贴',
      search: '搜索便利贴',
      empty: '还没有便利贴。点「新建便利贴」写下第一条想法吧。',
      noMatches: '没有匹配的便利贴。',
      titlePlaceholder: '标题',
      placeholder: '写点什么…',
      created: '创建',
      updated: '更新',
      delete: '删除',
      color: '换颜色',
      count: '共 {count} 张',
      saved: '已自动保存',
      clearAll: '清空全部',
      clearConfirm: '确定清空所有便利贴吗？',
      zoomOut: '缩小', zoomIn: '放大', zoomReset: '重置缩放', zoom: '缩放',
      pin: '置顶', unpin: '取消置顶',
      export: '导出', import: '导入', exportOk: '已导出 {count} 张便利贴', importOk: '成功导入 {count} 张便利贴',
      importFail: '导入失败：文件格式不正确', confirmImport: '导入将追加到现有便利贴，继续？',
      nothingToExport: '没有可导出的便利贴',
    }
    const en = {
      title: 'Sticky notes',
      subtitle: 'Jot down ideas; saved locally as you type.',
      add: 'New note',
      addHint: 'Add a sticky note',
      search: 'Search notes',
      empty: 'No notes yet. Click "New note" to write your first idea.',
      noMatches: 'No matching notes.',
      titlePlaceholder: 'Title',
      placeholder: 'Write something…',
      created: 'Created',
      updated: 'Updated',
      delete: 'Delete',
      color: 'Change color',
      count: '{count} notes',
      saved: 'Saved automatically',
      clearAll: 'Clear all',
      clearConfirm: 'Clear all sticky notes?',
      zoomOut: 'Zoom out', zoomIn: 'Zoom in', zoomReset: 'Reset zoom', zoom: 'Zoom',
      pin: 'Pin', unpin: 'Unpin',
      export: 'Export', import: 'Import', exportOk: 'Exported {count} notes', importOk: 'Imported {count} notes',
      importFail: 'Import failed: invalid file format', confirmImport: 'Import will append to existing notes. Continue?',
      nothingToExport: 'Nothing to export',
    }

    let t = (key) => (zh[key] || key)
    const fmt = (template, values) =>
      String(template || '').replace(/\{(\w+)\}/g, (_, k) => (values && values[k] != null ? values[k] : ''))

    function makeId() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      } catch (_) {}
      return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    }

    // ---------------------------------------------------------- storage ----
    function readNotes() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
          .filter((n) => n && typeof n === 'object')
          .map((n) => ({
            id: typeof n.id === 'string' ? n.id : makeId(),
            heading: typeof n.heading === 'string' ? n.heading : '',
            text: typeof n.text === 'string' ? n.text : '',
            color: COLORS.indexOf(n.color) >= 0 ? n.color : COLORS[0],
            createdAt: Number(n.createdAt) || Date.now(),
            updatedAt: Number(n.updatedAt) || Date.now(),
          }))
      } catch (_) {
        return []
      }
    }

    function writeNotes(notes) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
      } catch (_) {}
    }

    // ----------------------------------------------------------- styles ----
    const css = `
.dshNotes-root{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:20px 22px 28px;gap:14px;overflow:hidden;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base)}
.dshNotes-head{display:flex;flex-direction:column;gap:4px;flex:0 0 auto}
.dshNotes-title{font-size:20px;font-weight:600;line-height:1.3}
.dshNotes-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dshNotes-toolbar{display:flex;align-items:center;gap:8px;flex:0 0 auto;flex-wrap:wrap}
.dshNotes-search{flex:1 1 180px;min-width:120px;padding:7px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dshNotes-search:focus{border-color:var(--dsw-alias-brand-primary)}
.dshNotes-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer;white-space:nowrap}
.dshNotes-btn:hover{border-color:var(--dsw-alias-brand-primary)}
.dshNotes-btn-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border-color:transparent}
.dshNotes-btn-ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.dshNotes-btn-ghost:hover{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.dshNotes-meta{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-secondary);flex:0 0 auto}
.dshNotes-zoom{display:inline-flex;align-items:center;gap:2px;margin-left:auto}
.dshNotes-zoom .dshNotes-btn{padding:5px 10px;min-width:32px}
.dshNotes-zoomLabel{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;min-width:44px;text-align:center;cursor:pointer;font-family:inherit;padding:5px 2px;border-radius:6px}
.dshNotes-zoomLabel:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshNotes-grid{flex:1 1 auto;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;align-content:start;padding:4px 4px 24px}
.dshNotes-note{position:relative;display:flex;flex-direction:column;min-height:230px;border-radius:5px 5px 12px 12px;padding:18px 18px 12px;box-sizing:border-box;box-shadow:0 4px 14px rgba(0,0,0,.16);color:#3a3222}
.dshNotes-note.dshNotes-pinned{box-shadow:0 4px 18px rgba(214,158,46,.55);outline:2px solid rgba(214,158,46,.7)}
.dshNotes-pin{position:absolute;top:6px;right:6px;z-index:2;border:0;background:transparent;cursor:pointer;font-size:14px;line-height:1;padding:2px;border-radius:5px;opacity:.55}
.dshNotes-pin:hover{opacity:1}
.dshNotes-pinOn{opacity:1}
.dshNotes-heading{padding-right:26px}
.dshNotes-note:after{content:"";position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.10));border-radius:0 0 10px 10px;pointer-events:none}
.dshNotes-heading{flex:0 0 auto;border:0;outline:0;background:transparent;color:inherit;font-family:inherit;font-size:18px;font-weight:700;line-height:1.4;width:100%;box-sizing:border-box;padding:0 0 8px;border-bottom:1px solid rgba(0,0,0,.12)}
.dshNotes-heading::placeholder{color:rgba(58,50,34,.55)}
.dshNotes-text{flex:1 1 auto;resize:none;border:0;outline:0;background:transparent;color:inherit;font-family:inherit;font-size:15px;line-height:1.55;width:100%;box-sizing:border-box;padding:12px 0 6px;min-height:70px}
.dshNotes-text::placeholder{color:rgba(58,50,34,.45)}
.dshNotes-times{position:relative;z-index:1;display:flex;flex-direction:row;align-items:center;gap:12px;margin-top:4px;padding-top:6px;border-top:1px solid rgba(0,0,0,.10);font-size:10px;line-height:1.2;color:rgba(58,50,34,.72);flex-wrap:nowrap}
.dshNotes-times span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dshNotes-actions{position:relative;z-index:1;display:flex;align-items:center;gap:4px;margin-top:8px;opacity:0;transition:opacity .15s}
.dshNotes-note:hover .dshNotes-actions,.dshNotes-note:focus-within .dshNotes-actions{opacity:1}
.dshNotes-dot{width:16px;height:16px;border-radius:50%;border:2px solid rgba(0,0,0,.12);cursor:pointer;padding:0}
.dshNotes-dot-active{outline:2px solid rgba(0,0,0,.45);outline-offset:1px}
.dshNotes-del{margin-left:auto;border:0;background:transparent;color:#7a3a2a;cursor:pointer;font-size:14px;line-height:1;padding:2px 5px;border-radius:5px}
.dshNotes-del:hover{background:rgba(0,0,0,.10)}
.dshNotes-empty{grid-column:1/-1;display:flex;align-items:center;justify-content:center;min-height:180px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px;padding:20px}
.dshNotes-sidebar{display:block;width:100%;height:100%}
`
    function installStyles() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')
      if (existing) return () => {}
      const style = document.createElement('style')
      style.dataset.plugin = NS
      style.dataset.pluginCss = STYLE_ID
      style.textContent = css
      document.head.appendChild(style)
      return () => { style.remove() }
    }

    // ------------------------------------------------------------- icons ----
    function SidebarIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20
      return h('svg', {
        className: 'dshNotes-sidebar', viewBox: '0 0 24 24', width: size, height: size,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
        style: { opacity: props.active ? 1 : 0.82 },
      },
        h('path', { d: 'M5 3.5h11.2L20.5 7.8V20a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20V5A1.5 1.5 0 0 1 5 3.5z' }),
        h('path', { d: 'M16 3.8V8h4.2' }),
        h('path', { d: 'M7 12.5h9M7 16h6' })
      )
    }

    // -------------------------------------------------------------- note ----
    function formatTime(ts) {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ''
      const p = (n) => String(n).padStart(2, '0')
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    }

    function NoteCard({ note, onChange, onDelete }) {
      return h('div', { className: 'dshNotes-note' + (note.pinned ? ' dshNotes-pinned' : ''), style: { background: note.color } },
        h('button', {
          type: 'button', className: 'dshNotes-pin' + (note.pinned ? ' dshNotes-pinOn' : ''),
          title: note.pinned ? t('unpin') : t('pin'), 'aria-label': note.pinned ? t('unpin') : t('pin'),
          onClick: () => onChange({ pinned: !note.pinned }),
        }, note.pinned ? '📌' : '📍'),
        h('input', {
          className: 'dshNotes-heading', type: 'text',
          value: note.heading,
          placeholder: t('titlePlaceholder'),
          onChange: (e) => onChange({ heading: e.target.value }),
        }),
        h('textarea', {
          className: 'dshNotes-text',
          value: note.text,
          placeholder: t('placeholder'),
          onChange: (e) => onChange({ text: e.target.value }),
        }),
        h('div', { className: 'dshNotes-times' },
          h('span', null, t('created') + ' ' + formatTime(note.createdAt)),
          h('span', null, t('updated') + ' ' + formatTime(note.updatedAt))
        ),
        h('div', { className: 'dshNotes-actions' },
          COLORS.map((c) => h('button', {
            key: c, type: 'button',
            className: 'dshNotes-dot' + (note.color === c ? ' dshNotes-dot-active' : ''),
            style: { background: c },
            title: t('color'), 'aria-label': t('color'),
            onClick: () => onChange({ color: c }),
          })),
          h('button', {
            type: 'button', className: 'dshNotes-del', title: t('delete'),
            'aria-label': t('delete'),
            onClick: () => { if (window.confirm(t('clearConfirm'))) onDelete() },
          }, '✕')
        )
      )
    }

    // -------------------------------------------------------------- panel ----
    function NotesPanel() {
      const [notes, setNotes] = useState(readNotes)
      const [query, setQuery] = useState('')
      const [zoom, setZoom] = useState(1)
      const fileRef = useRef(null)
      const first = useRef(true)
      useEffect(() => {
        if (first.current) { first.current = false; return }
        writeNotes(notes)
      }, [notes])

      const exportNotes = useCallback(() => {
        if (!notes.length) { window.alert(t('nothingToExport')); return }
        const doc = { app: 'dsh-sticky-notes', version: 2, exportedAt: new Date().toISOString(), notes }
        try {
          const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = 'sticky-notes.json'
          document.body.appendChild(a); a.click(); a.remove()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          window.alert(fmt(t('exportOk'), { count: notes.length }))
        } catch (e) { window.alert(e.message) }
      }, [notes])

      const importNotes = useCallback(async (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        try {
          const doc = JSON.parse(await file.text())
          const list = Array.isArray(doc) ? doc : (doc && Array.isArray(doc.notes) ? doc.notes : null)
          if (!list) { window.alert(t('importFail')); e.target.value = ''; return }
          if (!window.confirm(t('confirmImport'))) { e.target.value = ''; return }
          const now = Date.now()
          const clean = list.filter((n) => n && typeof n === 'object').map((n, i) => ({
            id: makeId(),
            heading: String(n.heading || ''),
            text: String(n.text || ''),
            color: COLORS.indexOf(n.color) >= 0 ? n.color : COLORS[i % COLORS.length],
            pinned: Boolean(n.pinned),
            createdAt: Number(n.createdAt) || now,
            updatedAt: Number(n.updatedAt) || now,
          }))
          setNotes((prev) => [...clean, ...prev])
          window.alert(fmt(t('importOk'), { count: clean.length }))
        } catch (_) { window.alert(t('importFail')) }
        e.target.value = ''
      }, [])

      const addNote = useCallback(() => {
        const now = Date.now()
        setNotes((prev) => [{ id: makeId(), heading: '', text: '', color: COLORS[prev.length % COLORS.length], createdAt: now, updatedAt: now }, ...prev])
      }, [])
      const changeNote = useCallback((id, patch) => {
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
      }, [])
      const deleteNote = useCallback((id) => setNotes((prev) => prev.filter((n) => n.id !== id)), [])
      const clearAll = useCallback(() => {
        if (notes.length && window.confirm(t('clearConfirm'))) setNotes([])
      }, [notes.length])
      const zoomIn = useCallback(() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10)), [])
      const zoomOut = useCallback(() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10)), [])
      const zoomReset = useCallback(() => setZoom(1), [])

      const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        const match = q
          ? notes.filter((n) =>
              (n.heading || '').toLowerCase().indexOf(q) >= 0 ||
              n.text.toLowerCase().indexOf(q) >= 0
            )
          : notes.slice()
        // Pinned notes first, then preserve the original order within each group.
        return match.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      }, [notes, query])

      return h('div', { className: 'dshNotes-root' },
        h('div', { className: 'dshNotes-head' },
          h('div', { className: 'dshNotes-title' }, t('title')),
          h('div', { className: 'dshNotes-sub' }, t('subtitle'))
        ),
        h('div', { className: 'dshNotes-toolbar' },
          h('input', {
            className: 'dshNotes-search', type: 'search', value: query,
            placeholder: t('search'),
            onChange: (e) => setQuery(e.target.value),
          }),
          h('button', { type: 'button', className: 'dshNotes-btn dshNotes-btn-primary', onClick: addNote }, '+ ' + t('add')),
          h('button', { type: 'button', className: 'dshNotes-btn', title: t('export'), onClick: exportNotes }, t('export')),
          h('button', { type: 'button', className: 'dshNotes-btn', title: t('import'), onClick: () => fileRef.current && fileRef.current.click() }, t('import')),
          h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: importNotes }),
          h('div', { className: 'dshNotes-zoom' },
            h('button', { type: 'button', className: 'dshNotes-btn', title: t('zoomOut'), onClick: zoomOut }, '−'),
            h('button', { type: 'button', className: 'dshNotes-zoomLabel', title: t('zoomReset'), onClick: zoomReset }, Math.round(zoom * 100) + '%'),
            h('button', { type: 'button', className: 'dshNotes-btn', title: t('zoomIn'), onClick: zoomIn }, '+')
          )
        ),
        h('div', { className: 'dshNotes-meta' },
          h('span', null, fmt(t('count'), { count: notes.length })),
          h('span', null, t('saved'))
        ),
        h('div', { className: 'dshNotes-grid', style: { zoom: zoom } },
          filtered.length === 0
            ? h('div', { className: 'dshNotes-empty' }, query.trim() ? t('noMatches') : t('empty'))
            : filtered.map((n) => h(NoteCard, {
                key: n.id, note: n,
                onChange: (patch) => changeNote(n.id, patch),
                onDelete: () => deleteNote(n.id),
              }))
        )
      )
    }

    // -------------------------------------------------------------- apply ----
    function apply(ctx) {
      ctx.effect(() => installStyles(), 'dsh-sticky-notes: styles')
      if (ctx.locale !== undefined) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-sticky-notes: dictionaries')
        t = ctx.locale.bind(NS)
      }
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 18,
        label: () => t('title'),
        locale: NS,
      }, SidebarIcon)), 'dsh-sticky-notes: sidebar entry')
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      }, NotesPanel)), 'dsh-sticky-notes: panel')
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
