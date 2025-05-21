<template>
    <div>
        <button @click="showWrite = true" class="bg-sky-400 text-white px-4 py-2 rounded-full shadow">写留言</button>
        <button @click="showWrite = false" class="ml-4 bg-sky-400 text-white px-4 py-2 rounded-full">查看留言</button>

        <WriteLetter v-if="showWrite" />
        <UnlockView v-else />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import WriteLetter from '../components/WriteLetter.vue'
import UnlockView from '../components/UnlockView.vue'

const showWrite = ref(true)
</script>