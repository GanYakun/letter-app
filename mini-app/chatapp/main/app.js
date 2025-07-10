// import axios from "axios";

new Vue({
  el: '#app',
  data: {
    showProfileCard: false,
    cardTop: 0,
    cardLeft: 0,
    showZoomedImage: false,
    zoomedImageUrl: null,
    newMessage: '',
    myAvatar: null,
    myName: '',
    userLoginId: '',
    contacts: [
      // {
      //   id: 1,
      //   name: '张三',
      //   avatar: 'https://i.pravatar.cc/32?img=2',
      //   messages: [
      //     { id: 1, text: '你好，我是张三。', from: 'other' },
      //     { id: 2, text: '你好！', from: 'me' }
      //   ]
      // },
      // {
      //   id: 2,
      //   name: '李四',
      //   avatar: 'https://i.pravatar.cc/32?img=3',
      //   messages: [
      //     { id: 1, text: '最近怎么样？', from: 'other' }
      //   ]
      // },
      // {
      //   id: 3,
      //   name: '王五',
      //   avatar: 'https://i.pravatar.cc/32?img=4',
      //   messages: []
      // }
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
    // 开始与用户聊天
    startChatWithUser() {
      // 示例：选择第一个联系人作为聊天对象
      const targetContact = this.contacts[0]; // 你可以根据实际逻辑选择目标联系人

      if (targetContact) {
        this.currentContact = targetContact;
        this.showProfileCard = false; // 关闭卡片
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    // 新增：点击卡片中头像后放大显示
    zoomAvatar(url) {
      this.zoomedImageUrl = url;
      this.showZoomedImage = true;
    },

    // 关闭放大视图
    closeZoom() {
      this.showZoomedImage = false;
      this.zoomedImageUrl = null;
    },
    showProfileCardAt(event) {
      // 获取鼠标点击的屏幕坐标 + 页面滚动距离
      const mouseX = event.clientX + window.scrollX;
      const mouseY = event.clientY + window.scrollY;

      // 设置卡片的位置为鼠标点击位置（可加偏移量）
      const offsetX = 10; // 横向偏移
      const offsetY = 10; // 纵向偏移

      this.cardLeft = mouseX + offsetX;
      this.cardTop = mouseY + offsetY;

      this.showProfileCard = true;
      event.stopPropagation(); // 防止触发外部点击关闭
    },
    handleClickOutside(e) {
      const card = document.getElementById('profile-card');
      if (card && !card.contains(e.target)) {
        this.showProfileCard = false;
      }
    },

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
    async initUserInfo() {
      const params = new URLSearchParams(window.location.search);
      let username = params.get('username');
      let decodeUsername = decodeURIComponent(username);
      this.userLoginId = decodeUsername;
      let url = 'http://localhost:8083/auth/party/photo/' + decodeUsername;
      await axios.get(url, { responseType: 'blob' })
        .then((res) => {
          const imageUrl = URL.createObjectURL(res.data); // 创建临时对象 URL
          this.myAvatar = imageUrl; // 更新头像路径
        }
        );
      await axios.get('http://localhost:8083/auth/party/' + decodeUsername)
        .then((res) => {
          this.myName = res.data.data.partyName;
        }
        )
    },
    async initContacts() {
      let url = 'http://localhost:8083/auth/party/contacts/' + this.userLoginId;
      await axios.get(url)
        .then((res) => {
          let contacts = res.data.data;
          for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];
            let url = 'http://localhost:8083/auth/party/photo/' + contact.createdByUserLogin;
            axios.get(url, { responseType: 'blob' })
              .then((res) => {
                const imageUrl = URL.createObjectURL(res.data); // 创建临时对象 URL
                this.$set(this.contacts, this.contacts.length, {
                  id: contact.partyId,
                  name: contact.partyName,
                  avatar: imageUrl,
                  messages: []
                });
              }
              )
          }
        }
        )
      console.log(this.contacts);
    },
    // 获取最后一条消息文本
    getLastMessageText(contact) {
      if (contact.messages && contact.messages.length > 0) {
        const lastMessage = contact.messages[contact.messages.length - 1];
        return lastMessage.text;
      }
      return '  ';
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
    this.scrollToBottom();
    this.initUserInfo();
    this.initContacts();
    this.currentContact = this.contacts[0]; // 默认选中第一个联系人

  },
  beforeDestroy() {
    // Vue 2 使用 beforeDestroy，Vue 3 使用 beforeUnmount
    document.removeEventListener('click', this.handleClickOutside);
  }
});
