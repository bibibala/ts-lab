<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { exposeAction, exposeData, exposeForm, isWebMCPSupported } from '@bilibaba/ts-lab'
import { FORM_FIELDS, INVOICE_FIELDS, taxAmount } from './invoice'
import type { Invoice } from './invoice'

// ==================== State ====================

const mcpReady = ref(isWebMCPSupported())

const invoices = ref<Invoice[]>([
  { id: 'INV-001', customer: 'Acme Corp', amount: 12800, taxRate: 0.13, note: 'Q3 服务费', status: '已开票' },
  { id: 'INV-002', customer: 'Beta Ltd', amount: 5600, taxRate: 0.06, note: '', status: '已开票' },
])

const dialogOpen = ref(false)
const form = reactive({ customer: '', amount: 0, taxRate: 0.13, note: '' })
let nextId = 3

const logs = ref<string[]>(['页面初始化完成，等待操作…'])

// ==================== Computed ====================

const totalWithTax = computed(() => {
  return invoices.value.reduce((sum, inv) => sum + inv.amount + taxAmount(inv.amount, inv.taxRate), 0)
})

// ==================== Actions ====================

function addLog(msg: string) {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift(`[${time}] ${msg}`)
}

function openDialog() {
  form.customer = ''
  form.amount = 0
  form.taxRate = 0.13
  form.note = ''
  dialogOpen.value = true
  addLog('弹窗已打开，表单已重置')
}

function closeDialog() {
  dialogOpen.value = false
  addLog('弹窗已关闭')
}

function submitInvoice() {
  const { customer, amount, taxRate, note } = form
  if (!customer || !amount || amount <= 0) {
    addLog('❌ 提交被拦截: 客户名称或金额为空')
    return
  }
  const inv: Invoice = {
    id: `INV-${String(nextId++).padStart(3, '0')}`,
    customer,
    amount,
    taxRate,
    note,
    status: '已开票',
  }
  invoices.value.push(inv)
  dialogOpen.value = false
  addLog(`✅ 发票 ${inv.id}: ${customer} ¥${amount.toLocaleString()} 已创建`)
}

// ==================== WebMCP ====================

const controller = new AbortController()
const { signal } = controller

onMounted(() => {
  addLog(`WebMCP: ${exposeData('invoices', () => invoices.value, {
    idField: 'id',
    searchFields: ['id', 'customer'],
    fields: INVOICE_FIELDS,
    signal,
  }) ? 'invoices_search, invoices_add, invoices_delete, invoices_stats 已注册' : 'WebMCP 不可用'}`)

  addLog(`WebMCP: ${exposeAction('openInvoiceDialog', async () => {
    openDialog()
  }, { description: '打开新建发票弹窗（表单已清空）', signal })
    ? 'openInvoiceDialog 已注册' : ''}`)

  addLog(`WebMCP: ${exposeForm('invoiceForm', form, {
    description: '填写新建发票表单的字段',
    fields: FORM_FIELDS,
    required: ['customer', 'amount'],
    allowSubmit: true,
    onSubmit: submitInvoice,
  })
    ? 'invoiceForm_fill, invoiceForm_submit 已注册' : ''}`)
})

onUnmounted(() => controller.abort())
</script>

<template>
  <div class="app">
    <h1>🧾 发票管理</h1>
    <p class="subtitle">
      使用 <code>@bilibaba/ts-lab</code> 封装：
      <code>exposeData</code> + <code>exposeAction</code> + <code>exposeForm</code>
    </p>

    <!-- WebMCP 状态 -->
    <div class="badge ok" v-if="mcpReady">
      WebMCP ✅ 已就绪 — 7 个工具已注册
    </div>
    <div class="badge warn" v-else>
      WebMCP ⚠️ 不可用（需 Chrome 149+ 开启 chrome://flags/#webmcp）
    </div>

    <!-- 工具栏 -->
    <div class="card">
      <div class="toolbar">
        <h2>📋 发票列表</h2>
        <button class="btn-primary" @click="openDialog">＋ 新建发票</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>发票号</th>
            <th>客户</th>
            <th class="num">金额</th>
            <th>税率</th>
            <th class="num">税额</th>
            <th class="num">合计</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.id">
            <td>{{ inv.id }}</td>
            <td>{{ inv.customer }}</td>
            <td class="num">¥{{ inv.amount.toLocaleString() }}</td>
            <td>{{ (inv.taxRate * 100).toFixed(0) }}%</td>
            <td class="num">¥{{ taxAmount(inv.amount, inv.taxRate).toLocaleString() }}</td>
            <td class="num">¥{{ (inv.amount + taxAmount(inv.amount, inv.taxRate)).toLocaleString() }}</td>
            <td>{{ inv.status }}</td>
          </tr>
          <tr v-if="!invoices.length">
            <td colspan="7" class="empty">暂无发票</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="total-label">共 {{ invoices.length }} 张，合计</td>
            <td class="num total-value">¥{{ totalWithTax.toLocaleString() }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <dialog :open="dialogOpen" v-if="dialogOpen">
        <h3>新建发票</h3>
        <form @submit.prevent="submitInvoice">
          <div class="field">
            <label>客户名称</label>
            <input v-model="form.customer" placeholder="例如: Acme Corp">
          </div>
          <div class="form-row">
            <div class="field flex-1">
              <label>发票金额</label>
              <input v-model.number="form.amount" type="number" placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="field flex-1">
              <label>税率</label>
              <select v-model.number="form.taxRate">
                <option :value="0">0%</option>
                <option :value="0.06">6%</option>
                <option :value="0.13">13%</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>备注</label>
            <input v-model="form.note" placeholder="可选备注">
          </div>
          <div class="actions">
            <button type="button" class="btn-outline" @click="closeDialog">取消</button>
            <button type="submit" class="btn-primary">确认创建</button>
          </div>
        </form>
      </dialog>
    </Teleport>
    <div class="backdrop" v-if="dialogOpen" @click="closeDialog"></div>

    <!-- 日志 -->
    <div class="card">
      <h2>📟 操作日志</h2>
      <div class="log">
        <div v-for="(line, i) in logs" :key="i">{{ line }}</div>
      </div>
    </div>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, "Segoe UI", sans-serif; background: #f5f5f5; color: #222; }
.app { max-width: 780px; margin: 0 auto; padding: 24px 20px 60px; }
h1 { font-size: 20px; margin-bottom: 4px; }
.subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
.subtitle code { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-size: 12px; }

.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 16px;
}
.badge.ok { background: #e6f4ea; color: #137333; }
.badge.warn { background: #fff3cd; color: #8a6d00; }

.card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
h2 { font-size: 15px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; }
th { background: #fafafa; font-weight: 600; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.empty { text-align: center; color: #999; padding: 28px; }
tfoot td { border-bottom: none; font-weight: 600; }
.total-label { text-align: right; color: #555; }
.total-value { color: #137333; font-size: 14px; }

button {
  padding: 9px 18px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background .15s, transform .1s;
}
button:active { transform: scale(.97); }
.btn-primary { background: #1967d2; color: #fff; }
.btn-primary:hover { background: #1557b0; }
.btn-outline { background: #fff; color: #1967d2; border: 1px solid #1967d2; }
.btn-outline:hover { background: #e8f0fe; }

dialog {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  border: none; border-radius: 12px; padding: 28px; min-width: 440px; z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
}
dialog h3 { margin-bottom: 16px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.field label { font-size: 12px; color: #555; font-weight: 500; }
.field input, .field select {
  padding: 8px 12px; border: 1px solid #d0d0d0; border-radius: 6px;
  font-size: 14px; outline: none; transition: border-color .15s;
}
.field input:focus, .field select:focus { border-color: #1967d2; }
.form-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 99;
}

.log {
  background: #1a1a2e; color: #0f0; font-family: "SF Mono", monospace;
  font-size: 12px; padding: 14px; border-radius: 8px; min-height: 60px;
  max-height: 180px; overflow-y: auto; white-space: pre-wrap; margin-top: 8px;
}
</style>
