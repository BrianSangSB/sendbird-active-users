const spinner = document.querySelector('.spinner');
const loginWrapper = document.querySelector('#login-wrapper');
const appIdInput = document.querySelector('#app_id');
const userIdInput = document.querySelector('#user_id');
const accessTokenInput = document.querySelector('#access_token');
const loginButton = document.querySelector('#login-button');
const toggleButton = document.querySelector('#toggle-button');
const activeUsersList = document.querySelector('#active-users-list');
const activeUsersTable = document.querySelector('#active-users-list-table-body');

var APP_ID, USER_ID, ACCESS_TOKEN, SYNC_INTERVAL = 3000, intervalId;
appIdInput.addEventListener('input', checkValidity)
userIdInput.addEventListener('input', checkValidity)
accessTokenInput.addEventListener('input', checkValidity)
loginButton.addEventListener('click', login)
toggleButton.addEventListener('click', toggleSyncing)

function toggleSyncing() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  } else {
    intervalId = setInterval(initUsersTable, SYNC_INTERVAL);
  }

  toggleButton.innerHTML = intervalId ? 'Stop syncing' : 'Start syncing'
}

function checkValidity() {
  if (appIdInput.value && userIdInput.value && accessTokenInput.value) {
    loginButton.disabled = false;
  } else {
    loginButton.disabled = true;
  }
}

function login() {
  spinner.style.display = 'inline-block';
  loginButton.disabled = true;
  APP_ID = appIdInput.value;
  USER_ID = userIdInput.value;
  ACCESS_TOKEN = accessTokenInput.value;

  var sb = new SendBird({ appId: APP_ID });
  sb.connect(USER_ID, ACCESS_TOKEN, function(user, error) {
    if (error) {
      loginButton.disabled = false;
      console.error(error);
      return
    }
    appIdInput.removeEventListener('input', checkValidity);
    userIdInput.removeEventListener('input', checkValidity);
    accessTokenInput.removeEventListener('input', checkValidity);
    loginButton.removeEventListener('input', login);
    loginWrapper.style.display = 'none';
    toggleSyncing()
  });
}

function getActiveUsers() {
  var sb = SendBird.getInstance();
  var listQuery = sb.createApplicationUserListQuery();
  listQuery.limit = 100;
  const users = [];

  return new Promise((resolve, reject) => {
    async function _getActiveUsers() {
      if (listQuery.hasNext && !listQuery.isLoading) {
        listQuery.next(function(_users, error) {
          if (error) {
            console.error(error);
            return
          }
          users.push(..._users);
          _getActiveUsers()
        });
      } else {
        if (listQuery.isLoading) {
          setTimeout(() => {
            _getActiveUsers()
          }, 500)
        } else {
          resolve(users.filter(user => user.connectionStatus === sb.User.ONLINE))
        }
      }
    }
    _getActiveUsers()
  })
}

async function initUsersTable() {
  spinner.style.display = 'inline-block';
  activeUsersTable.innerHTML = '';
  const users = await getActiveUsers()
  if (!users) {
    return
  }

  users.forEach((user, i) => {
    activeUsersTable.innerHTML += `
      <tr>
        <td>${i}</td>
        <td>${user.userId}</td>
        <td>${user.nickname} <span id="online-status"></span></td>
      </tr>
    `
  })
  activeUsersList.style.display = 'block'
  spinner.style.display = 'none';
}
