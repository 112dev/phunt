<template>
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Select destination</h1>
        <p class="py-6">
          Select a destination directory where your digital media assets are
          going to be organized.
        </p>
        <button class="btn btn-primary" @click="selectDirectory">
          Select directory
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SelectDestinationPage",
  methods: {
    async selectDirectory() {
      const result = await window.electron.openDirectory();

      // @TODO
      console.log(result);
    },
  },
};
</script>
