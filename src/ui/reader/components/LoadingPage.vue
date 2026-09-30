<template>
  <div class="loading-page">
    <div class="loading-content">
      <div class="book-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
        </svg>
        <!--img src="../../../../public/icon/64.png" alt="Epub Icon" /-->
      </div>
      <h2>{{ title }}</h2>
      <div class="loading-spinner">
        <span class="loader"></span>
      </div>
      <p class="loading-text">{{ message }}</p>
      <p class="loading-subtitle">{{ subtitle }}</p>
      
      <!-- Optional progress indicator -->
      <div v-if="showProgress" class="progress-info">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Loading Book'
  },
  message: {
    type: String,
    default: 'Please wait while we prepare your book...'
  },
  subtitle: {
    type: String,
    default: 'This may take a moment'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.loading-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color, #ffffff);
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-content {
  text-align: center;
  max-width: 500px;
  padding: 40px 20px;
  animation: slideUp 0.5s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.book-icon {
  color: var(--hover-outline-color, #10b981);
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

.book-icon img {
  width: 64px;
  height: 64px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.loading-content h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 0;
  background: linear-gradient(135deg, var(--hover-outline-color, #10b981), #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.loader{
  display: block;
  position: relative;
  height: 20px;
  width: 140px;
  background-image: 
  linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), 
  linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), 
  linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), 
  linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0);
  background-repeat: no-repeat;
  background-size: 20px auto;
  background-position: 0 0, 40px 0, 80px 0, 120px 0;
  animation: pgfill 1s linear infinite;
}

@keyframes pgfill {
  0% {   background-image: linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0); }
  25% {   background-image: linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0); }
  50% {   background-image: linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0); }
  75% {   background-image: linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-bg, #FFF) 20px, transparent 0); }
  100% {   background-image: linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0), linear-gradient(var(--loader-fill, #059669) 20px, transparent 0); }
}

.loading-text {
  font-size: 18px;
  color: var(--text-primary); /* can add, #1a1a1a */
  font-weight: 500;
  margin-bottom: 8px;
}

.loading-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #9ca3af);
  font-weight: 400;
  margin-bottom: 24px;
}

.progress-info {
  margin-top: 24px;
  width: 100%;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--spinner-bg, rgba(16, 185, 129, 0.2));
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--hover-outline-color, #10b981), #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

.progress-text {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

/* Theme-driven support via CSS variables; no system override here */

/* Mobile responsiveness */
@media (max-width: 767px) {
  .loading-content {
    padding: 20px;
  }
  
  .loading-content h2 {
    font-size: 24px;
  }
  
  .loading-text {
    font-size: 16px;
  }
  
  .loader {
    width: 60px;
    background-size: 12px auto;
    background-position: 0 0, 16px 0, 32px 0, 48px 0;
  }
}
</style>
