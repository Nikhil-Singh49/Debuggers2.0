const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    navLinks.forEach((item) => item.classList.toggle('active', item === link));
  });
});

const now = new Date();
const month = now.toLocaleString('en-US', { month: 'long' });
const year = now.getFullYear();
const tableText = document.querySelector('.panel-date');
if (tableText) {
  tableText.textContent = `${month} ${year}`;
}

const searchInput = document.querySelector('.search-box input');
searchInput.addEventListener('input', (e) => {
  const term = e.target.value.trim().toLowerCase();
  const tableRows = Array.from(document.querySelectorAll('.student-table tbody tr'));

  tableRows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
});
