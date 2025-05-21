/* 文件：src/components/UnlockView.vue */
<template>
  <div
    class="mt-6 max-w-md mx-auto bg-journalBg text-journalText font-journal p-6 rounded-xl shadow-md border border-gray-300">
    <label class="block mb-2">请输入密码查看留言：</label>
    <input v-model="inputPassword" type="password"
      class="w-full border px-3 py-2 mb-4 rounded bg-white text-journalText border-gray-300" />
    <button @click="tryUnlock" class="bg-accent text-white px-4 py-2 rounded shadow">解锁</button>

    <div v-if="letter" class="mt-6">
      <div v-if="!isUnlocked">
        <p class="text-accent font-semibold">还不能查看哦，请等待解锁时间：</p>
        <p class="font-mono">解锁时间：{{ formattedUnlockTime }}</p>
        <p class="text-sm text-gray-500 mt-2">倒计时：{{ countdown }}</p>
      </div>
      <div v-else>
        <h2 class="text-xl font-bold text-accent mb-2">{{ letter.title }}</h2>
        <p class="mt-4 whitespace-pre-line">{{ letter.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import CryptoJS from 'crypto-js'

const inputPassword = ref('')
const letter = ref(null)
const countdown = ref('')
let timer = null

const isUnlocked = computed(() => {
  if (!letter.value) return false
  return Date.now() >= new Date(letter.value.unlockTime).getTime()
})

const formattedUnlockTime = computed(() => {
  if (!letter.value) return ''
  const date = new Date(letter.value.unlockTime)
  return date.toLocaleString()
})

const updateCountdown = () => {
  if (!letter.value) return
  const unlockTs = new Date(letter.value.unlockTime).getTime()
  const now = Date.now()
  const diff = unlockTs - now

  if (diff <= 0) {
    countdown.value = '已解锁！'
    clearInterval(timer)
  } else {
    const totalSec = Math.floor(diff / 1000)
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    countdown.value = `${hrs}小时 ${mins}分钟 ${secs}秒`
  }
}

const tryUnlock = async () => {
  // const encrypted = localStorage.getItem('secret_letter')
  let letter = await window.electronAPI.getMemoryByPassword(inputPassword.value);
  console.log("letters:", letter);
  if (!letter.password) return alert('没有保存的留言！')
  // try {
  //   const decrypted = CryptoJS.AES.decrypt(letter.password, inputPassword.value).toString(CryptoJS.enc.Utf8)
  //   if (!decrypted) throw new Error()
  //   letter.value = JSON.parse(decrypted)
  //   updateCountdown()
  //   timer = setInterval(updateCountdown, 1000)
  // } catch {
  //   alert('密码错误！')
  // }


}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
