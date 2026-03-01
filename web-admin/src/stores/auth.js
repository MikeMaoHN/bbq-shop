import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    admin: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    async login(credentials) {
      const data = await api.login(credentials)
      this.token = data.token
      this.admin = data.admin
      localStorage.setItem('token', data.token)
    },

    async getInfo() {
      try {
        const admin = await api.getInfo()
        this.admin = admin
      } catch (error) {
        console.error('获取管理员信息失败:', error)
      }
    },

    logout() {
      this.token = ''
      this.admin = null
      localStorage.removeItem('token')
    }
  }
})
