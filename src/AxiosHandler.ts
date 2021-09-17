import Axios from "axios";
import { keys } from './config/keys';
import { INominator, INominatorInfo, IEventParams, IEventsInfo } from './interfaces';

const nominatorAxios = Axios.create({
  baseURL: `${keys.BACKEND_URL}/nominator/id`
});

const eventsAxios = Axios.create({
  baseURL: `${keys.BACKEND_URL}/events/stash`
});

export const apiGetInfoNominator = (data: INominator): Promise<INominatorInfo | null> =>
  nominatorAxios.get(`${data.params.id}/${data.params.chain}`).then((res) => {
    if (res.status === 200) {
      return res.data;
    } else {
      console.log(`status: `, res.status);
      return null;
    }
  }).catch((err) => {
    console.log(`err: `, err.response.status);
    return null;
  });

export const apiGetNotificationEvents = (data: IEventParams): Promise<IEventsInfo> =>
  eventsAxios
    .get(`${data.params.id}/${data.params.chain}`, {params: data.query})
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.warn('in apiGetNotificationEvents, err: ', err);
      return {
        commissions: [],
        inactives: [],
        slashes: [],
        stalePayouts: [],
        payouts: []
      };
    });


