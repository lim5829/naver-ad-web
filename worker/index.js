// 순위 조회를 서울 AWS 리전 근처에서 실행하는 Worker. 해외 서버에서는 네이버가 광고를 주지 않는다.
import { onRequestGet } from "../functions/api/place-rank.js";

export default {
  fetch(request) {
    return onRequestGet({ request });
  },
};
