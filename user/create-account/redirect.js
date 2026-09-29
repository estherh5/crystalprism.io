try {
  if (sessionStorage.getItem('account-request') != 'delete') {
    location.replace('https://auth.crystalprism.io/register');
  }
} catch (e) {
  location.replace('https://auth.crystalprism.io/register');
}
