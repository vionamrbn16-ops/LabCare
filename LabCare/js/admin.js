
document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("search-ticket").addEventListener(
    "input",
    loadTickets
  );

  document.getElementById("filter-status").addEventListener(
    "change",
    loadTickets
  );

  const message = document.getElementById("message");
  const rows = document.getElementById("ticket-rows");

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.replace("index.html");
    return;
  }

  const user = sessionData.session.user;

  // Periksa role admin dari tabel profiles
  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    alert("Akses ditolak. Halaman ini khusus admin.");
    window.location.replace("dashboard.html");
    return;
  }

  document.getElementById("logout-btn").addEventListener(
    "click",
    async () => {
      await supabaseClient.auth.signOut();
      window.location.replace("index.html");
    }
  );

  async function loadTickets() {
    message.textContent = "Memuat tiket...";
    rows.replaceChildren();

    const { data, error } = await supabaseClient
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.textContent =
        "Tiket belum dapat dimuat. Periksa kebijakan akses admin di Supabase.";
      console.error(error);
      return;
    }

    message.textContent = data.length
      ? "Jumlah tiket: " + data.length
      : "Belum ada laporan masuk.";

    data.forEach((ticket) => {
      const tr = document.createElement("tr");

      function cell(value) {
        const td = document.createElement("td");
        td.textContent = value ?? "-";
        return td;
      }

      tr.appendChild(cell(
        ticket.created_at
          ? new Date(ticket.created_at).toLocaleString("id-ID")
          : "-"
      ));

      tr.appendChild(cell(
        (ticket.reporter_name || "-") +
        "\n" + (ticket.reporter_type || "")
      ));

      tr.appendChild(cell(
        (ticket.category || "-") +
        "\n" + (ticket.description || "")
      ));

      tr.appendChild(cell(ticket.priority));

      const statusCell = document.createElement("td");
      const select = document.createElement("select");

      ["Pending", "Done"].forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        select.appendChild(option);
      });

      select.value = ticket.status || "Pending";
      statusCell.appendChild(select);
      tr.appendChild(statusCell);

      const noteCell = document.createElement("td");

      const noteInput = document.createElement("textarea");
      noteInput.value = ticket.admin_note || "";
      noteInput.placeholder = "Catatan penanganan...";
      noteInput.maxLength = 1000;
      noteInput.rows = 3;
      noteInput.style.width = "180px";
      noteInput.style.padding = "8px";
      noteInput.style.color = "#f1f5f9";
      noteInput.style.background = "#091525";
      noteInput.style.border = "1px solid #334155";
      noteInput.style.borderRadius = "8px";

      noteCell.appendChild(noteInput);
      tr.appendChild(noteCell);

      const actionCell = document.createElement("td");
      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Simpan";

      saveButton.addEventListener("click", async () => {
        saveButton.disabled = true;

        try {
          const { error: updateError } = await supabaseClient
            .from("tickets")
            .update({
              status: select.value,
              updated_at: new Date().toISOString()
            })
            .eq("id", ticket.id);

          if (updateError) throw updateError;

          alert("Status tiket berhasil diperbarui.");
          await loadTickets();
        } catch (error) {
          alert("Gagal memperbarui tiket: " + error.message);
        } finally {
          saveButton.disabled = false;
        }
      });


      actionCell.appendChild(saveButton);
      tr.appendChild(actionCell);
      rows.appendChild(tr);
    });
  }

  await loadTickets();
});
