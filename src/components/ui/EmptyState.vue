<template>
  <div class="empty-state" role="status">
    <span class="empty-state-icon"
      ><component
        :is="icons[icon] || PackageSearch"
        :size="26"
        :stroke-width="1.5"
    /></span>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
<script setup>
import {
  PackageSearch,
  ShoppingBasket,
  TrendingUp,
  CreditCard,
  PackageX,
  CalendarClock,
  Users,
  ShieldCheck,
} from "lucide-vue-next";
defineProps({
  title: { type: String, required: true },
  description: String,
  icon: String,
});
const icons = {
  basket: ShoppingBasket,
  trending: TrendingUp,
  card: CreditCard,
  package: PackageX,
  calendar: CalendarClock,
  users: Users,
  shield: ShieldCheck,
};
</script>
