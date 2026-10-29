
async function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Semua kolom wajib diisi!");
    return;
  }

  if (password.length < 6) {
    alert("Password minimal 6 karakter!");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) throw error;

    if (data.session) {
      alert("Pendaftaran berhasil!");
      window.location.replace("dashboard.html");
    } else {
      alert("Pendaftaran berhasil. Jika diminta, konfirmasi email terlebih dahulu.");
    }
  } catch (error) {
    alert("Pendaftaran gagal: " + error.message);
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Email dan password wajib diisi!");
    return;
  }

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    // Arahkan berdasarkan role jika profil tersedia.
    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Kesalahan profil:", profileError.message);
    }

    if (profile?.role === "admin") {
      window.location.replace("admin.html");
    } else {
      window.location.replace("dashboard.html");
    }
  } catch (error) {
    alert("Login gagal: " + error.message);
  }
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Logout gagal: " + error.message);
    return;
  }

  window.location.replace("index.html");
}
