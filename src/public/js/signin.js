import { createApp } from 'https://unpkg.com/petite-vue?module';

/* eslint-disable no-undef */
if (typeof window.ethereum !== 'undefined') {
    const AUTH_REQUEST_MESSAGE = document.getElementsByName('authRequestMessage')[0].value;
    const ERROR_CONNECT_METAMASK = 'Please connect to MetaMask.';

    createApp({
        alert: {
            variant: 'warning',
            message: '',
        },
        onAccountsChanged(accounts) {
            if (!accounts.length) {
                this.alert.message = ERROR_CONNECT_METAMASK;
            } else {
                window.ethereum
                    .request({
                        method: 'eth_signTypedData_v3',
                        params: [accounts[0], AUTH_REQUEST_MESSAGE],
                    })
                    .then((signature) => {
                        document.getElementsByName('authRequestSignature')[0].value = signature;
                        document.getElementById('form-signin').submit();
                    })
                    .catch((err) => {
                        if (err.code === 4001) {
                            this.alert.message = ERROR_CONNECT_METAMASK;
                        }
                    });
            }
        },
        signin() {
            window.ethereum
                .request({ method: 'eth_requestAccounts' })
                .then(this.onAccountsChanged)
                .catch((err) => {
                    if (err.code === 4001) {
                        this.alert.message = ERROR_CONNECT_METAMASK;
                    } else {
                        console.error(err);
                    }
                });
        },
    }).mount();
} else {
    console.log('Please install MetaMask!');
}
/* eslint-enable no-undef */
