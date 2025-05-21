// import axios from "axios";

new Vue({
  el: '#app',
  data: {
    newMessage: '',
    myAvatar: null,
    contacts: [
      {
        id: 1,
        name: '张三',
        avatar: 'https://i.pravatar.cc/32?img=2',
        messages: [
          { id: 1, text: '你好，我是张三。', from: 'other' },
          { id: 2, text: '你好！', from: 'me' }
        ]
      },
      {
        id: 2,
        name: '李四',
        avatar: 'https://i.pravatar.cc/32?img=3',
        messages: [
          { id: 1, text: '最近怎么样？', from: 'other' }
        ]
      },
      {
        id: 3,
        name: '王五',
        avatar: 'https://i.pravatar.cc/32?img=4',
        messages: []
      }
    ],
    currentContact: null,
    messageIdCounter: 100,
    searchQuery: '', // 搜索关键词
    currentView: 'chat'
  },
  computed: {
    filteredContacts() {
      if (!this.searchQuery) {
        return this.contacts;
      }
      const query = this.searchQuery.toLowerCase();
      return this.contacts.filter(contact => contact.name.toLowerCase().includes(query));
    }
  },
  methods: {
    selectContact(contact) {
      this.currentContact = contact;
      this.$nextTick(() => this.scrollToBottom());
    },
    sendMessage() {
      const text = this.newMessage.trim();
      if (!text || !this.currentContact) return;
      this.currentContact.messages.push({
        id: this.messageIdCounter++,
        text,
        from: 'me'
      });
      this.newMessage = '';
      this.scrollToBottom();
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const body = this.$refs.chatBody;
        if (body) body.scrollTop = body.scrollHeight;
      });
    },
    // 控制窗口的方法
    minimizeWindow() {
      window.electronAPI.minimizeWindow();
    },
    maximizeWindow() {
      window.electronAPI.maximizeWindow();;
    },
    closeWindow() {
      window.electronAPI.closeWindow();
    },
    startDrag(event) {
      ipcRenderer.send('start-drag');
    },
    avatarReq() {
      const params = new URLSearchParams(window.location.search);
      let username = params.get('username');
      let decodeUsername = decodeURIComponent(username);
      let url = 'http://localhost:8083/auth/party/photo/' + decodeUsername;
      axios.get(url, { responseType: 'blob' })
        .then((res) => {
          const imageUrl = URL.createObjectURL(res.data); // 创建临时对象 URL
          this.myAvatar = imageUrl; // 更新头像路径
        });

    }
  },
  mounted() {
    this.currentContact = this.contacts[0]; // 默认选中第一个联系人
    this.scrollToBottom();
    this.avatarReq();
  }
});
