
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.replace("index.html");
    return;
  }

  const user = sessionData.session.user;
  const welcome = document.getElementById("welcome");
  const form = document.getElementById("ticket-form");
  const ticketList = document.getElementById("ticket-list");
  const submitButton = document.getElementById("submit-ticket");

  welcome.textContent =
    "Login sebagai " +
    (user.user_metadata?.full_name || user.email);

  document.getElementById("logout-btn").addEventListener(
    "click",
    async () => {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        alert("Gagal keluar: " + error.message);
        return;
      }

      window.location.replace("index.html");
    }
  );

  async function loadTickets() {
    ticketList.replaceChildren();

    const { data, error } = await supabaseClient
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      ticketList.textContent =
        "Gagal memuat laporan. Pastikan tabel tickets dan kebijakan akses sudah dibuat.";
      console.error(error);
      return;
    }

    if (!data || data.length === 0) {
      ticketList.textContent = "Belum ada laporan. Silakan buat laporan baru.";
      ticketList.className = "empty";
      return;
    }

    ticketList.className = "";

    data.forEach((ticket) => {
      const article = document.createElement("article");
      article.className = "ticket";

      const title = document.createElement("h3");
      title.textContent = ticket.category || "Laporan IT";

      const description = document.createElement("p");
      description.textContent = ticket.description || "";

      const meta = document.createElement("p");
      meta.textContent =
        "Prioritas: " + (ticket.priority || "Sedang") +
        " • " +
        (ticket.created_at
          ? new Date(ticket.created_at).toLocaleString("id-ID")
          : "");

      const status = document.createElement("span");
      status.className = "status" +
        (ticket.status === "Done" ? " done" : "");
      status.textContent = "Status: " + (ticket.status || "Pending");

      article.append(title, description, meta, status);
      ticketList.appendChild(article);


      const adminNote = document.createElement("p");
      adminNote.style.marginTop = "10px";
      adminNote.textContent = ticket.admin_note
        ? "Catatan admin: " + ticket.admin_note
        : "Belum ada catatan dari admin.";

      article.append(title, description, meta, status, adminNote);
      ticketList.appendChild(article);

    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "Mengirim...";

    const payload = {
      user_id: user.id,
      reporter_name: document.getElementById("reporter-name").value.trim(),
      reporter_type: document.getElementById("reporter-type").value,
      category: document.getElementById("ticket-category").value,
      priority: document.getElementById("ticket-priority").value,
      description: document.getElementById("ticket-description").value.trim(),
      status: "Pending"
    };

    try {
      if (!payload.reporter_name || !payload.description) {
        throw new Error("Nama dan deskripsi wajib diisi.");
      }

      const { error } = await supabaseClient
        .from("tickets")
        .insert(payload);

      if (error) throw error;

      alert("Laporan berhasil dikirim!");
      form.reset();
      await loadTickets();
    } catch (error) {
      alert("Laporan gagal dikirim: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Kirim Laporan";
    }
  });

  await loadTickets();
});
