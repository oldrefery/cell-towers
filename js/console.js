const tabs = document.querySelectorAll('.tab');
const infoTabs = document.querySelectorAll('.info-tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
    });
});

infoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        infoTabs.forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
    });
});
