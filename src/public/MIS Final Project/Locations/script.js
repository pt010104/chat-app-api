const mapUrls = {
    'store1': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3546.8240410011617!2d106.6947434!3d10.783089799999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f36c74caa99%3A0x743c446a2eef20a5!2zxJDhuqFpIGjhu41jIEtpbmggdOG6vyBUUC5IQ00gKFVFSCkgLSBDxqEgc-G7nyBB!5e1!3m2!1svi!2s!4v1726851175708!5m2!1svi!2s?key=AIzaSyAFU-4-KUspo1REtr6bq5rB0dNNIuW6PdY",
    'store2': "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3547.0853279953053!2d106.6657665!3d10.7609052!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ee4595019ad%3A0xf2a1b15c6af2c1a6!2zxJDhuqFpIGjhu41jIEtpbmggdOG6vyBUUC4gSOG7kyBDaMOtIE1pbmggKFVFSCkgLSBDxqEgc-G7nyBC!5e1!3m2!1svi!2s!4v1726851571181!5m2!1svi!2s",
    'store3': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3546.941115021453!2d106.6776034!3d10.7731552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752e92ba980879%3A0xa6ce615ff4798c33!2zxJDhuqFpIEjhu41jIEtpbmggVOG6vyBUUC5IQ00gKFVFSCkgQ1MgQw!5e1!3m2!1svi!2s!4v1726851670495!5m2!1svi!2s",
    'store4': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3546.72256241259!2d106.688399!3d10.7916937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528cd61248c17%3A0xd98660b104f2d673!2zVmnhu4duIElTQiAtIMSQ4bqhaSBo4buNYyBLaW5oIFThur8gVFAuSENNIC0gQ8ahIHPhu58gRA!5e1!3m2!1svi!2s!4v1726851779170!5m2!1svi!2s",
    'store5': "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3546.7365660450005!2d106.696974!3d10.7905068!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528caa2882a5b%3A0x3e26b4089f95bdd7!2zxJDhuqFpIEjhu41jIEtpbmggVOG6vyBUUC5IQ00gKFVFSCkgQ1MgRQ!5e1!3m2!1svi!2s!4v1726851824851!5m2!1svi!2s",
    'store6': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3546.671259003986!2d106.67220789999999!3d10.7960409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529483fae0483%3A0x18ef7db2eb9cb947!2zxJDhuqFpIEjhu41jIEtpbmggVOG6vyBUUC5IQ00gKFVFSCkgQ1MgSA!5e1!3m2!1svi!2s!4v1726851868532!5m2!1svi!2s",
    'store7': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3546.825074965916!2d106.69518099999999!3d10.783002100000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f36bc83e6b9%3A0xbd217e5278515e11!2sUEH%20-%20ISB!5e1!3m2!1svi!2s!4v1726851908550!5m2!1svi!2s",
    'store8': "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3547.7294959723918!2d106.6401289!3d10.706018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752e02a0cd28ad%3A0x322c07b75de6b74c!2zxJDhuqFpIGjhu41jIEtpbmggdOG6vyBUUC4gSOG7kyBDaMOtIE1pbmggKFVFSCkgLSBDxqEgc-G7nyBOZ3V54buFbiBWxINuIExpbmg!5e1!3m2!1svi!2s!4v1726851946531!5m2!1svi!2s",
};

function changeMap(storeId) {
    const mapFrame = document.getElementById('mapFrame');
    const mapMessage = document.getElementById('mapMessage');
    
    mapFrame.src = mapUrls[storeId];
    mapFrame.style.display = 'block';
    mapMessage.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const stores = document.querySelectorAll('.store');
    stores.forEach(store => {
        store.addEventListener('click', function() {
            const storeId = this.getAttribute('data-store');
            changeMap(storeId);
        });
    });

    const menuIcon = document.querySelector('.menu-icon');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    menuIcon.addEventListener('click', function() {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
});