import { defineComponent } from 'vue'

export const OiyoLayout = defineComponent({
  name: 'OiyoLayout',
  setup(_, props) {
    return () => props.slots.default?.()
  },
})
