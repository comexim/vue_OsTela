// Vuetify plugin setup for Vue 3
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import WebFontLoader from 'webfontloader'

WebFontLoader.load({
  google: {
    families: [
      'Roboto:100,300,400,500,700,900&display=swap',
      'Material+Icons'
    ]
  }
})

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})
