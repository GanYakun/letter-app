<template>
    <div class="mt-6 text-left max-w-md mx-auto bg-white p-4 rounded shadow">
        <label class="block mb-2">标题：</label>
        <input v-model="title" class="w-full border px-2 py-1 mb-4" />

        <label class="block mb-2">内容：</label>
        <textarea v-model="content" rows="5" class="w-full border px-2 py-1 mb-4"></textarea>

        <label class="block mb-2">密码：</label>
        <input v-model="password" type="password" class="w-full border px-2 py-1 mb-4" />

        <label class="block mb-2">可查看时间：</label>
        <input v-model="unlockTime" type="datetime-local" class="w-full border px-2 py-1 mb-4" />

        <button @click="saveLetter" class="bg-sky-400 text-white px-4 py-2 rounded">保存留言</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import CryptoJS from 'crypto-js'
// import Store from 'electron-store'

const title = ref('')
const content = ref('')
const password = ref('')
const unlockTime = ref('')

const saveLetter = () => {
    // const encrypted = CryptoJS.AES.encrypt(
    //     JSON.stringify({ title: title.value, content: content.value, unlockTime: unlockTime.value }),
    //     password.value
    // ).toString()
    // localStorage.setItem('secret_letter', encrypted)
    window.electronAPI.addMemory(title.value, content.value, password.value, unlockTime.value)
    alert('留言已保存！')
    title.value = content.value = password.value = unlockTime.value = ''
}
</script>