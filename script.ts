import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.createMany({
        data: [{
            id: '9940213539',
            email: 'shobana.senthil94@gmail.com',
            fname: 'Shobana',
            lname: 'S',
            walletId: '0xEEEDab9cAc42Ad100dBed36A1467ae545F83C6Fc',
            webPushData: {
                'vapidKeys': {
                    'publicKey': 'BKqgl7rhPZ6pXFIKRoGKRcHYVaWJlZD-aR391c4GVoogO1UV2qOGeHrfAMTUY8zr_jWNQijp0ZzK5-UAifmaVqY',
                    'privateKey': 'CkrWpOJ0PfaXZWCUCOjn1KD9zO-REKaD3zZ6_oC9M3Q'
                },
                'subscription': {
                    'endpoint': 'https://updates.push.services.mozilla.com/wpush/v1/gAAAAABj883ZWDlfe4FedGHdlkQrADJbc_1Zz0i9d7rCBhX5TPT24NySUG3TIIDca_uQ8Tk5HmYfOqZ1I3ojMoTY-z3h2vYs4wnS0c23mo5vkCqins3HU8RX4z_tQCSx0a6a5rfYkgea',
                    'expirationTime': null,
                    'keys': {
                        'auth': '4WMH-ZHeNpSMmWUE_eWGSw',
                        'p256dh': 'BBnQ7CMylnQRb9yOr0PZH_obtSiVMIzXslRG482Xk3P6Dw3LZW2bn3SnuUSp2g-n561V_b-fjkSNWKmg28_AWD8'
                    }
                }
            }
        }, {
            id: '9962589489',
            email: 'senthil83kumar@gmail.com',
            fname: 'Senthil',
            lname: 'Chandramohan',
            walletId: '0xE0dFE8AC359BC2DA603af1B1530E20cE51234E8C',
            webPushData: {
                'vapidKeys': {
                    'publicKey': 'BKo5IQ8Ri-ApK0RC2IpLZGhqAU2g8qleLvfuPSg4wRKIwFTTDMUmtsb2BqyqcXS3z4HY35UKS3Hmtc9h1nrXp0Q',
                    'privateKey': 'Vxeqqb3BZufw39WeFXU1XvAHAlCItzFiTUjuqnY-31M'
                },
                'subscription': {
                    'endpoint': 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABj89UK8LclpLnCJzUkMscQRCTvkfhK0OsB2wctvH7fqxBapcPs0k-O6RVKqXmj1niqLEsIR7-cX7lV30wFIFjf4sEiR3cFenWmrShkPHHym_vzBmbxLUwYrLgMJPayza7coslXhDTMszMRMcywIk-2b6LDabSXJbw_8mA33-OCYq56i1I',
                    'expirationTime': null,
                    'keys': {
                        'auth': 'Fl_YR1rmS9QE1vwRvSrKNg',
                        'p256dh': 'BEk96uF9bIyeCEygdy_xnK3B5GIe-OgE615EdTg4hq1LasOSsPftfzRH-kiqGby9xBfpF9YkI3U0aPQO58rLU7A'
                    }
                }
            }
        }]
    });

    console.log(user);
}


main()
    .catch(e => {
        console.error(e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });