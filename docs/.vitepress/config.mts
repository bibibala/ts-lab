import { defineConfig } from 'vitepress'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const zhSidebar = [
  { text: '快速开始', link: '/zh/' },
  {
    text: '工具函数',
    items: [
      { text: '树形数据查询', link: '/zh/api/tools/recursion' },
      { text: '事件总线', link: '/zh/api/tools/bus' },
      { text: 'WebSocket', link: '/zh/api/tools/ws' },
      { text: '二维码生成和读取', link: '/zh/api/tools/qrCode' },
      { text: 'MD5', link: '/zh/api/tools/md5' },
    ],
  },
  {
    text: '浏览器 API',
    items: [
      {
        text: '剪贴板',
        items: [
          { text: '概览', link: '/zh/api/browser/clipboard/' },
          { text: 'HTML 与图片', link: '/zh/api/browser/clipboard/rich' },
          { text: '文件粘贴 · 剪切 · 事件', link: '/zh/api/browser/clipboard/events' },
        ],
      },
      { text: '运行环境识别', link: '/zh/api/browser/env' },
      { text: '网络状态读取', link: '/zh/api/browser/network' },
    ],
  },
  {
    text: 'UI 组件',
    items: [
      { text: 'Toast', link: '/zh/api/ui/feedback/index' },
      { text: 'Loading', link: '/zh/api/ui/loading/' },
      { text: '顶部进度条', link: '/zh/api/ui/progress' },
      { text: '页面水印', link: '/zh/api/ui/watermark' },
    ],
  },
  {
    text: 'WASM',
    items: [
      { text: '图片转图标', link: '/zh/api/wasm/image' },
    ],
  },
]

const enSidebar = [
  { text: 'Getting Started', link: '/en/' },
  {
    text: 'Utilities',
    items: [
      { text: 'Tree Data Query', link: '/en/api/tools/recursion' },
      { text: 'Event Bus', link: '/en/api/tools/bus' },
      { text: 'WebSocket', link: '/en/api/tools/ws' },
      { text: 'QR Code', link: '/en/api/tools/qrCode' },
      { text: 'MD5', link: '/en/api/tools/md5' },
    ],
  },
  {
    text: 'Browser APIs',
    items: [
      {
        text: 'Clipboard',
        items: [
          { text: 'Overview', link: '/en/api/browser/clipboard/' },
          { text: 'HTML & Images', link: '/en/api/browser/clipboard/rich' },
          { text: 'Files · Cut · Events', link: '/en/api/browser/clipboard/events' },
        ],
      },
      { text: 'Environment Detection', link: '/en/api/browser/env' },
      { text: 'Network Info', link: '/en/api/browser/network' },
    ],
  },
  {
    text: 'UI Components',
    items: [
      { text: 'Toast', link: '/en/api/ui/feedback/index' },
      { text: 'Loading', link: '/en/api/ui/loading/' },
      { text: 'Progress Bar', link: '/en/api/ui/progress' },
      { text: 'Watermark', link: '/en/api/ui/watermark' },
    ],
  },
  {
    text: 'WASM',
    items: [
      { text: 'Image to Icon', link: '/en/api/wasm/image' },
    ],
  },
]

// Dev-only redirect: / → /zh/
const rootRedirectPlugin: Plugin = {
  name: 'root-redirect',
  configureServer(server) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === '/' || req.url === '/index.html') {
          res.writeHead(302, { Location: '/zh/' })
          res.end()
          return
        }
        next()
      },
    )
  },
}


// @ts-ignore
// @ts-ignore
export default defineConfig({
  title: 'ts-lab',
  description: '浏览器工具库 — 事件总线、剪贴板、网络信息、树遍历、二维码',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
  ],

  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        sidebarMenuLabel: '菜单',
        lastUpdated: {
          text: '最后更新',
          formatOptions: { dateStyle: 'short', timeStyle: 'short' },
        },
        editLink: {
          pattern: 'https://github.com/bibibala/ts-lab/edit/main/docs/zh/:path',
          text: '在 GitHub 上编辑此页',
        },
        sidebar: zhSidebar,
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        sidebarMenuLabel: 'Menu',
        lastUpdated: {
          text: 'Last Updated',
          formatOptions: { dateStyle: 'short', timeStyle: 'short' },
        },
        editLink: {
          pattern: 'https://github.com/bibibala/ts-lab/edit/main/docs/en/:path',
          text: 'Edit this page on GitHub',
        },
        sidebar: enSidebar,
      },
    },
  },

  vite: {
    plugins: [rootRedirectPlugin],
  },

  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bibibala/ts-lab' },
    ],
  },
})
