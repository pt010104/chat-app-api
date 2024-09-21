document.getElementById('findStoreButton').addEventListener('click', function() {
    window.location.href = '../Locations/index.html'; // Adjust the path as needed
});

document.querySelector('.menu-icon').addEventListener('click', function() {
    const dropdown = document.querySelector('.dropdown-menu');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
  