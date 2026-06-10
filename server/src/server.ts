import { 앱만들기 } from "./app.js";
import { 환경설정읽기 } from "./config/env.js";

const 설정 = 환경설정읽기();
const 앱 = 앱만들기();

await 앱.listen({
  host: 설정.host,
  port: 설정.port,
});
