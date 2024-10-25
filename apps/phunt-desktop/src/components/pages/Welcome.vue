<template>
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">phunt-desktop</h1>
        <p class="py-6">
          Welcome to your one and only digital media asset organizer.
        </p>
        <RouterLink class="btn btn-primary" to="/select-destination"
          >Get Started</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WelcomePage",
};
</script>
