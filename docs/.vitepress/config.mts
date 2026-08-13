import { defineConfig } from 'vitepress'

const zhSidebar = [
  { text: '快速开始', link: '/guide/' },
  { text: '安装', link: '/guide/installation' },
  {
    text: '工具函数',
    collapsed: false,
    items: [
      { text: '树形数据查询', link: '/api/tools/recursion' },
      { text: '事件总线', link: '/api/tools/bus' },
      { text: 'WebSocket', link: '/api/tools/ws' },
      { text: '二维码生成和读取', link: '/api/tools/qrCode' },
      { text: 'MD5', link: '/api/tools/md5' },
    ],
  },
  {
    text: '浏览器 API',
    collapsed: false,
    items: [
      {
        text: '剪贴板',
        collapsed: true,
        items: [
          { text: '概览', link: '/api/browser/clipboard/' },
          { text: '文本读写', link: '/api/browser/clipboard/text' },
          { text: '图片与富文本', link: '/api/browser/clipboard/rich' },
          { text: '文件 · 剪切 · 事件', link: '/api/browser/clipboard/file' },
        ],
      },
      { text: '运行环境识别', link: '/api/browser/env' },
      { text: '网络状态读取', link: '/api/browser/network' },
      { text: 'WebMCP 工具暴露', link: '/api/browser/webmcp' },
    ],
  },
  {
    text: 'UI 组件',
    collapsed: false,
    items: [
      { text: 'Toast', link: '/api/ui/feedback/index' },
      { text: 'Loading', link: '/api/ui/loading/' },
      { text: '顶部进度条', link: '/api/ui/progress' },
      { text: '页面水印', link: '/api/ui/watermark' },
    ],
  },
  {
    text: 'WASM',
    collapsed: false,
    items: [
      { text: '图片转图标', link: '/api/wasm/image' },
    ],
  },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'ts-lab',
  description: '浏览器工具库 — WebMCP、事件总线、剪贴板、网络信息、树遍历、二维码',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    sidebarMenuLabel: '菜单',
    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },
    editLink: {
      pattern: 'https://github.com/bibibala/ts-lab/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    nav: [
      { text: '快速开始', link: '/guide/' },
    ],
    sidebar: zhSidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bibibala/ts-lab' },
    ],
  },
})
