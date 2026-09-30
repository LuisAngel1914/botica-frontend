<template>
  <aside class="cart-panel" aria-label="Carrito de cobro">
    <header class="cart-header">
      <div class="flex items-center gap-2.5">
        <span
          class="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700"
          ><ShoppingBasket :size="18"
        /></span>
        <div>
          <h2 class="text-sm font-semibold text-slate-950">Venta actual</h2>
          <p class="mt-0.5 text-[10px] text-slate-500">
            {{ units }} {{ units === 1 ? "unidad" : "unidades" }} ·
            {{ cart.length }} {{ cart.length === 1 ? "producto" : "productos" }}
          </p>
        </div>
      </div>
      <AppBadge tone="accent">En curso</AppBadge>
    </header>
    <div class="border-b border-slate-100 px-4 py-3">
      <label for="customer-document" class="field-label !mb-1.5"
        >Cliente
        <span class="font-normal text-slate-400">/ DNI o RUC</span></label
      >
      <form class="flex gap-2" @submit.prevent="$emit('find-customer')">
        <input
          id="customer-document"
          :value="documentNumber"
          :disabled="processing"
          class="field-control !min-h-10 !py-2 !text-xs"
          placeholder="Documento del cliente"
          @input="$emit('update:document-number', $event.target.value)"
        /><button
          class="btn btn-secondary !min-h-10 !px-3 !py-2"
          :disabled="processing || !documentNumber.trim()"
          type="submit"
          aria-label="Consultar cliente"
        >
          <Search :size="16" />
        </button>
      </form>
      <p
        class="mt-2 flex items-center gap-1.5 text-[10px]"
        :class="customer ? 'text-cyan-800' : 'text-slate-500'"
      >
        <UserRound :size="12" />{{
          customer
            ? customer.nombre_razon_social || customer.nombre
            : "Cliente eventual · identifica al paciente si requiere receta"
        }}
      </p>
    </div>
    <div class="cart-lines px-4">
      <ul v-if="cart.length">
        <li
          v-for="(item, index) in cart"
          :key="item.producto_id"
          class="cart-line"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-semibold leading-5 text-slate-800">
                {{ item.nombre }}
              </p>
              <p class="text-[10px] text-slate-500">
                {{ currencySymbol }} {{ money(item.precio_unitario) }} por unidad
              </p>
              <p
                v-if="item.requiere_receta"
                class="mt-1 flex items-center gap-1 text-[10px] text-amber-800"
              >
                <FileCheck2 :size="12" />Receta verificada
              </p>
            </div>
            <button
              class="icon-button !h-8 !w-8 hover:!bg-red-50 hover:!text-red-700"
              :disabled="processing"
              :aria-label="'Quitar ' + item.nombre"
              @click="$emit('remove', index)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <div class="quantity-control">
              <button
                :disabled="processing || item.cantidad <= 1"
                :aria-label="'Reducir cantidad de ' + item.nombre"
                @click="$emit('quantity', item, item.cantidad - 1)"
              >
                <Minus :size="13" /></button
              ><input
                :value="item.cantidad"
                :disabled="processing"
                :aria-label="'Cantidad de ' + item.nombre"
                :max="item.stock_max"
                min="1"
                step="1"
                type="number"
                @change="$emit('quantity', item, Number($event.target.value))"
              /><button
                :disabled="processing || item.cantidad >= item.stock_max"
                :aria-label="'Aumentar cantidad de ' + item.nombre"
                @click="$emit('quantity', item, item.cantidad + 1)"
              >
                <Plus :size="13" />
              </button>
            </div>
            <strong class="text-sm font-semibold text-slate-950 tabular-nums"
              >{{ currencySymbol }} {{ money(item.cantidad * item.precio_unitario) }}</strong
            >
          </div>
        </li>
      </ul>
      <EmptyState
        v-else
        icon="basket"
        title="Tu próxima venta empieza aquí"
        description="Agrega productos desde el catálogo o escanea su código."
      />
    </div>
    <footer class="border-t border-slate-200 bg-slate-50/60 p-4">
      <fieldset :disabled="processing">
        <legend class="field-label">Método de pago</legend>
        <div class="payment-options">
          <label
            v-for="method in methods"
            :key="method.value"
            class="payment-option"
            ><input
              class="sr-only"
              type="radio"
              name="payment-method"
              :value="method.value"
              :checked="paymentMethod === method.value"
              @change="$emit('update:payment-method', method.value)"
            /><component :is="method.icon" :size="17" />{{
              method.value
            }}</label
          >
        </div>
      </fieldset>
      <div class="my-4 flex items-end justify-between">
        <div>
          <p class="text-[11px] text-slate-500">Total a cobrar</p>
          <p class="mt-1 text-[10px] text-slate-400">
            {{ units }} {{ units === 1 ? "unidad" : "unidades" }} en esta venta
          </p>
        </div>
        <strong
          class="text-[28px] font-semibold leading-none tracking-tight text-slate-950 tabular-nums"
          >{{ currencySymbol }} {{ money(total) }}</strong
        >
      </div>
      <button
        class="btn btn-primary checkout-button"
        :disabled="!cart.length || processing"
        @click="$emit('checkout')"
      >
        <span class="flex items-center gap-2"
          ><LoaderCircle
            v-if="processing"
            class="animate-spin"
            :size="17"
          /><CreditCard v-else :size="17" />{{
            processing ? "Registrando venta…" : "Cobrar venta"
          }}</span
        ><ArrowRight v-if="!processing" :size="18" />
      </button>
      <p
        class="mt-2.5 flex items-center justify-center gap-1 text-[9px] text-slate-500"
      >
        <ShieldCheck :size="11" />Genera boleta demostrativa al finalizar
      </p>
    </footer>
  </aside>
</template>
<script setup>
import { computed } from "vue";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  FileCheck2,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-vue-next";
import AppBadge from "../ui/AppBadge.vue";
import EmptyState from "../ui/EmptyState.vue";
import { money } from "../../utils/productPresentation";
import { useBusinessConfig } from "../../composables/useBusinessConfig";
const { currencySymbol } = useBusinessConfig();
const props = defineProps({
  cart: { type: Array, default: () => [] },
  customer: Object,
  documentNumber: { type: String, default: "" },
  paymentMethod: { type: String, default: "Efectivo" },
  processing: Boolean,
  total: { type: Number, default: 0 },
});
defineEmits([
  "update:document-number",
  "find-customer",
  "remove",
  "quantity",
  "update:payment-method",
  "checkout",
]);
const units = computed(() =>
  props.cart.reduce((sum, item) => sum + item.cantidad, 0),
);
const methods = [
  { value: "Efectivo", icon: Banknote },
  { value: "Yape", icon: Smartphone },
  { value: "Plin", icon: Smartphone },
  { value: "Tarjeta", icon: CreditCard },
];
</script>
