function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    if (username === "admin" && password === "123") {
      document.getElementById("login").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      loadCategories();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  }
  
  function createCategory() {
    const category = document.getElementById("categoryName").value;
    fetch("http://localhost:5000/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: "admin",
        password: "123",
      },
      body: JSON.stringify({ category }),
    })
      .then(() => {
        loadCategories();
        alert("Categoría creada");
      })
      .catch(error => console.error("Error al crear categoría:", error));
  }
  
  function loadCategories() {
    fetch("http://localhost:5000/categories", {
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(response => response.json())
      .then(categories => {
        const select = document.getElementById("categoryList");
        select.innerHTML = "";
        categories.forEach(category => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent = category.name;
          select.appendChild(option);
        });
  
        if (categories.length > 0) {
          document.getElementById("categoryList").value = categories[0].name;
          loadPDFs();
        }
      })
      .catch(error => console.error("Error al cargar categorías:", error));
  }
  
  function loadPDFs() {
    const category = document.getElementById("categoryList").value;
  
    fetch(`http://localhost:5000/files/${category}`, {
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(response => response.json())
      .then(files => {
        const list = document.getElementById("pdfList");
        list.innerHTML = "";
        files.forEach(file => {
          const card = document.createElement("div");
          card.classList.add("card");
          card.innerHTML = `
            <h3>${file.name}</h3>
            <a href="http://localhost:5000${file.url}" target="_blank">Ver PDF</a>
          `;
          list.appendChild(card);
        });
      })
      .catch(error => console.error("Error al cargar archivos:", error));
  }
  
  function uploadPDF() {
    const category = document.getElementById("categoryList").value;
    const input = document.getElementById("pdfInput");
  
    if (!category || input.files.length === 0) {
      alert("Selecciona una categoría y un archivo.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", input.files[0]);
    formData.append("category", category);
  
    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(() => {
        alert("PDF subido exitosamente");
        loadPDFs();
      })
      .catch(error => console.error("Error al subir archivo:", error));
  }
  function deletePDF(fileId) {
    if (!confirm("¿Estás seguro de que deseas eliminar este PDF?")) return;
  
    fetch(`http://localhost:5000/files/${fileId}`, {
      method: "DELETE",
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(() => {
        alert("PDF eliminado exitosamente");
        loadPDFs();
      })
      .catch(error => console.error("Error al eliminar archivo:", error));
  }
  
  
  function movePDF(fileId) {
    const newCategory = prompt("Ingresa la nueva categoría:");
  
    if (!newCategory) {
      alert("La nueva categoría es obligatoria.");
      return;
    }
  
    fetch(`http://localhost:5000/files/${fileId}/move`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        username: "admin",
        password: "123",
      },
      body: JSON.stringify({ newCategory }),
    })
      .then(() => {
        alert("PDF movido exitosamente");
        loadPDFs();
      })
      .catch(error => console.error("Error al mover archivo:", error));
  }
  
  function loadPDFs() {
    const category = document.getElementById("categoryList").value;
  
    fetch(`http://localhost:5000/files/${category}`, {
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(response => response.json())
      .then(files => {
        const list = document.getElementById("pdfList");
        list.innerHTML = "";
        files.forEach(file => {
          const card = document.createElement("div");
          card.classList.add("card");
          card.innerHTML = `
            <h3>${file.name}</h3>
            <a href="http://localhost:5000${file.url}" target="_blank">Ver PDF</a>
            <button onclick="deletePDF('${file._id}')">Eliminar</button>
            <button onclick="movePDF('${file._id}')">Mover</button>
          `;
          list.appendChild(card);
        });
      })
      .catch(error => console.error("Error al cargar archivos:", error));
  }
  
  function deleteCategory(categoryName) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría '${categoryName}' y todos sus archivos?`)) return;
  
    fetch(`http://localhost:5000/categories/${categoryName}`, {
      method: "DELETE",
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(() => {
        alert(`Categoría '${categoryName}' eliminada exitosamente.`);
        loadCategories(); // Actualizar la lista de categorías
      })
      .catch(error => console.error("Error al eliminar categoría:", error));
  }

  function loadCategories() {
    fetch("http://localhost:5000/categories", {
      headers: {
        username: "admin",
        password: "123",
      },
    })
      .then(response => response.json())
      .then(categories => {
        const select = document.getElementById("categoryList");
        const categoryContainer = document.getElementById("categoryContainer");
        select.innerHTML = "";
        categoryContainer.innerHTML = "";
  
        categories.forEach(category => {
          // Añadir categorías al select
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent = category.name;
          select.appendChild(option);
  
          // Crear lista de categorías con botón de eliminación
          const categoryItem = document.createElement("div");
          categoryItem.classList.add("category-item");
          categoryItem.innerHTML = `
            <span>${category.name}</span>
            <button onclick="deleteCategory('${category.name}')">Eliminar</button>
          `;
          categoryContainer.appendChild(categoryItem);
        });
  
        // Seleccionar la primera categoría por defecto
        if (categories.length > 0) {
          select.value = categories[0].name;
          loadPDFs();
        }
      })
      .catch(error => console.error("Error al cargar categorías:", error));
  }
  
  function toggleDarkMode() {
    const body = document.body;
    const button = document.getElementById("darkModeToggle");
  
    if (body.classList.contains("light-mode")) {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      button.textContent = "Modo Claro";
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      button.textContent = "Modo Oscuro";
    }
  }
  // Función para cerrar sesión
function logout() {
    // Regresa al login o página principal
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('login').style.display = 'block';
    // Opcionalmente redirigir
    location.href = './';
}


// Modo Estudiante
function openStudentMode() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('studentSidebar').style.display = 'flex';
    loadCategoriesForStudents();
  }
  
  // Cargar categorías en el modo estudiante
  function loadCategoriesForStudents() {
    const categoryList = document.getElementById('studentCategoryList');
    categoryList.innerHTML = ''; // Limpia categorías anteriores
    const categories = ['Ciencia', 'Anatomía', 'Patología']; // Ejemplo estático, puedes cargar dinámicamente
    categories.forEach(category => {
      const li = document.createElement('li');
      li.textContent = category;
      li.onclick = () => loadPDFsForCategory(category);
      categoryList.appendChild(li);
    });
  }
  
  // Mostrar PDFs según la categoría seleccionada
  function loadPDFsForCategory(category) {
    const pdfList = document.getElementById('pdfList');
    pdfList.innerHTML = `<p>Mostrando PDFs de la categoría: <strong>${category}</strong></p>`;
    // Aquí podrías cargar dinámicamente los PDFs de la categoría seleccionada
  }
  