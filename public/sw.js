self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);

        // Detect redirect to Workstation auth
        if (response.url.includes("workstations.cloud.google.com/ui/auth")) {
          console.warn("[SW] Workstation session expired — notifying client...");
          const allClients = await self.clients.matchAll();
          for (const client of allClients) {
            client.postMessage({
              type: "SESSION_EXPIRED",
              redirectUrl: response.url,
            });
          }
          // Return a dummy 401 instead of a blocked CORS redirect
          return new Response("Session expired", { status: 401 });
        }

        return response;
      } catch (err) {
        console.error("[SW] Fetch failed:", err);
        return new Response("Offline or network error", { status: 500 });
      }
    })()
  );
});
