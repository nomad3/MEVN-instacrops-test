import axios from 'axios'

export default() => {
  return axios.create({
    baseURL: 'http://165.22.150.109:8081'
  })
}
