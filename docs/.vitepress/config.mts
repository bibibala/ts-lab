import { defineConfig } from 'vitepress'

const zhSidebar = [
  {
    text: '指南',
    items: [
      { text: '快速开始', link: '/guide/' },
      { text: '安装', link: '/guide/installation' },
    ],
  },
  {
    text: 'API',
    collapsed: false,
    items: [
      { text: '树形数据查询', link: '/api/recursion' },
      { text: '类型安全事件通信', link: '/api/bus' },
    ],
  },
  {
    text: '浏览器工具',
    collapsed: false,
    items: [
      { text: '图片写入剪贴板', link: '/api/browser/clipboard' },
      { text: '运行环境识别', link: '/api/browser/env' },
      { text: 'Toast 与 Loading', link: '/api/browser/feedback' },
      { text: '网络状态读取', link: '/api/browser/network' },
      { text: 'WebMCP 工具暴露', link: '/api/browser/webmcp' },
    ],
  },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'ts-lab',
  description: '浏览器工具库 — WebMCP、事件总线、剪贴板、网络信息、树遍历',

  themeConfig: {
    search: { provider: 'local' },
    sidebarMenuLabel: '菜单',
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/recursion' },
    ],
    sidebar: zhSidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bibibala/ts-lab' },
    ],
  },
})
