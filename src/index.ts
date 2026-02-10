import axios from 'axios'
import UserAgent from 'user-agents'
import { getDateRangeChunks, sleep } from './utils'
import {
    DateRange,
    IntradayData,
    EquityDetails,
    EquityTradeInfo,
    EquityHistoricalData,
    SeriesData,
    IndexDetails,
    IndexHistoricalData,
    OptionChainData,
    EquityCorporateInfo,
    Glossary,
    Holiday,
    MarketStatus,
    MarketTurnover,
    IndexName,
    Circular,
    EquityMaster,
    PreOpenMarketData,
    DailyReport
} from './interface'

export enum ApiList {
    GLOSSARY = '/api/cmsContent?url=/glossary',
    HOLIDAY_TRADING = '/api/holiday-master?type=trading',
    HOLIDAY_CLEARING = '/api/holiday-master?type=clearing',
    MARKET_STATUS = '/api/marketStatus',
    MARKET_TURNOVER = '/api/market-turnover',
    ALL_INDICES = '/api/allIndices',
    INDEX_NAMES = '/api/index-names',
    CIRCULARS = '/api/circulars',
    LATEST_CIRCULARS = '/api/latest-circular',
    EQUITY_MASTER = '/api/equity-master',
    MARKET_DATA_PRE_OPEN = '/api/market-data-pre-open?key=ALL',
    MERGED_DAILY_REPORTS_CAPITAL = '/api/merged-daily-reports?key=favCapital',
    MERGED_DAILY_REPORTS_DERIVATIVES = '/api/merged-daily-reports?key=favDerivatives',
    MERGED_DAILY_REPORTS_DEBT = '/api/merged-daily-reports?key=favDebt'
}

export class NseIndia {
    private readonly baseUrl = 'https://www.nseindia.com'
    private readonly cookieMaxAge = 60 // should be in seconds
    private readonly baseHeaders = {
        'Authority': 'www.nseindia.com',
        'Referer': 'https://www.nseindia.com/',
        'Accept': '*/*',
        'Origin': this.baseUrl,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'application/json, text/plain, */*',
        'Connection': 'keep-alive'
    }
    private userAgent = ''
    private cookies = ''
    private cookieUsedCount = 0
    private cookieExpiry = new Date().getTime() + (this.cookieMaxAge * 1000)
    private noOfConnections = 0
    private fiveOther = ['RELIANCE', 'ICICI', 'HDFCBANK', 'AXISBANK', 'RBLBANK']
    // Define the headers using the type for better IDE support
   /* private myHeaders: AxiosRequestHeaders  = {
            'Content-Type': 'application/json',
          //   'Authorization': 'Bearer my-token',
            'X-Custom-Header': 'custom-value' ,  Authorization: undefined
            };
            */
    private async tryOut (symbol :any ) { 
         let userAgent = new UserAgent().toString()
         let re : any = undefined;
      
         // let intCfg: InternalAxiosRequestConfig<any> = {  headers: this.myHeaders }
          try { 
            re =  await axios.get(`${this.baseUrl}/get-quotes/equity?symbol=${symbol}`, {
                headers: {...this.baseHeaders,'User-Agent': userAgent}
           
            })
             if(re !==undefined){
                console.log("NSEINDIA responded ")
                    return re;
            }   
        } 
        catch(err){
             //  const mockedAxios = axios as jest.Mocked<typeof axios>;
                 // Handle errors appropriately, potentially using AxiosError type
                console.error(err);
                return   Promise.resolve({
                     data: [   {
                        id: 1,
                        name: 'Joe Doe'
                        }]
                     }); /*mockedAxios.get.mockResolvedValue({
                        data: [
                            {
                            id: 1,
                            name: 'Joe Doe'
                            },
                            {
                            id: 2,
                            name: 'Jane Doe'
                            }
                        ],
                        });
                        */
                 /*  if (isAxiosError(err)) {
                  console.error('Axios error:', err.message);
                        // Construct a full dummy AxiosResponse
                        const dummyResponse: AxiosResponse<any> = {
                            data: {
                            id: 'userId',
                            name: 'Fallback User',
                            },
                            status: 200, // Or a status code indicating a fallback response, e.g., 200 OK
                            statusText: 'OK (Fallback)',
                            headers: {},
                            config: intCfg, // Use the original request config
                            request: err.request,
                        };
                        return dummyResponse;
                        } */
        }
                throw new Error('Failed to fetch '+symbol);
        }
    
    private async getNifty50fiveOther() : Promise<any> {
          let userAgent = new UserAgent().toString()
        //let intCfg: InternalAxiosRequestConfig<any> = {  headers: this.myHeaders }
          let response  = undefined; /* AxiosResponse<any> = {
                        data: {
                        id: 'dmu'+ '_' + Math.random()*25,
                        name: 'Fallback User',
                        },
                        status: 200, // Or a status code indicating a fallback response, e.g., 200 OK
                        statusText: 'OK (Fallback)',
                        headers: {},
                         config: intCfg, // Use the original request config
                       // request: error.request,
                    };*/
                    for( let t = 0 ; t < this.fiveOther.length ; t++ ){
                        let STOCK  = this.fiveOther[t];
                                 response =await this.tryOut(STOCK) 
                            if(response !==undefined){
                                console.log("NSEINDIA responded  for "+STOCK)
                                break;
                                }   
                    }
                    this.fiveOther.forEach(
                    async  (STOCK:any ) =>   {
                            
                        }
          ) 
          if ( response !== undefined){
                 return response;
          }
          else {
          //  const mockedAxios = axios as jest.Mocked<typeof axios>;
             return  Promise.resolve({
                data: [   {
                        id: 1,
                        name: 'Joe Doe'
                        }]
            }); /* mockedAxios.get.mockResolvedValue({
                    data: [
                        {
                        id: 1,
                        name: 'Joe Doe'
                        },
                        {
                        id: 2,
                        name: 'Jane Doe'
                        }
                    ],
                    });*/
          }
         
    }
    private async getNseCookies() {
        if (this.cookies === '' || this.cookieUsedCount > 10 || this.cookieExpiry <= new Date().getTime()) {
            this.userAgent = new UserAgent().toString()
            /*const response = await axios.get(`${this.baseUrl}/get-quotes/equity?symbol=TCS`, {
                headers: {...this.baseHeaders,'User-Agent': this.userAgent}
            })*/
            const response = await this.getNifty50fiveOther(); /*await axios.get(`${this.baseUrl}/get-quotes/equity?symbol=TCS`, {
                headers: {...this.baseHeaders,'User-Agent': this.userAgent}
            })*/
            const setCookies: string[] | undefined = response.headers['set-cookie']
            const cookies: string[] = []
            if (setCookies) {
                setCookies.forEach((cookie: string) => {
                    const cookieKeyValue = cookie.split(';')[0]
                    cookies.push(cookieKeyValue)
                })
                this.cookies = cookies.join('; ')
                this.cookieUsedCount = 0
                this.cookieExpiry = new Date().getTime() + (this.cookieMaxAge * 1000)
            }
            this.cookieUsedCount++
            return this.cookies
        }
        this.cookieUsedCount++
        return this.cookies
    }
    /**
     * 
     * @param url NSE API's URL
     * @returns JSON data from NSE India
     */
    async getData(url: string): Promise<any> {
        let retries = 0
        let hasError = false
        do {
            while (this.noOfConnections >= 5) {
                await sleep(500)
            }
            this.noOfConnections++
            try {
                const nseCookies =       await this.getNseCookies()
                if ( nseCookies !== undefined) { 
                const response = await axios.get(url, {
                                    headers: {
                                        ...this.baseHeaders,
                                        'Cookie': nseCookies,
                                        'User-Agent': this.userAgent
                                    }
                                })
                                this.noOfConnections--
                                return response.data

                  }     
                  else { 
                    console.log('NSE did not sent cookies for any of the 5 '+ this.fiveOther.join(","));
                  }
               
            } catch (error) {
                hasError = true
                retries++
                this.noOfConnections--
                if (retries >= 10)
                    throw error
            }
        } while (hasError);
    }
    /**
     * 
     * @param apiEndpoint 
     * @returns 
     */
    async getDataByEndpoint(apiEndpoint: string): Promise<any> {
        return this.getData(`${this.baseUrl}${apiEndpoint}`)
    }
    /**
     * 
     * @returns List of NSE equity symbols
     */
    async getAllStockSymbols(): Promise<string[]> {
        const { data } = await this.getDataByEndpoint(ApiList.MARKET_DATA_PRE_OPEN)
        return data.map((obj: { metadata: { symbol: string } }) => obj.metadata.symbol).sort()
    }
    /**
     * 
     * @param symbol 
     * @returns 
     */
    getEquityDetails(symbol: string): Promise<EquityDetails> {
        return this.getDataByEndpoint(`/api/quote-equity?symbol=${encodeURIComponent(symbol.toUpperCase())}`)
    }
    /**
     * 
     * @param symbol 
     * @returns 
     */
    getEquityTradeInfo(symbol: string): Promise<EquityTradeInfo> {
        return this.getDataByEndpoint(`/api/quote-equity?symbol=${encodeURIComponent(symbol
            .toUpperCase())}&section=trade_info`)
    }

    /**
     * 
     * @param symbol 
     * @returns 
     */
    getEquityCorporateInfo(symbol: string): Promise<EquityCorporateInfo> {
        return this.getDataByEndpoint(`/api/top-corp-info?symbol=${encodeURIComponent(symbol
            .toUpperCase())}&market=equities`)
    }
    /**
     * 
     * @param symbol 
     * @param isPreOpenData 
     * @returns 
     */
    async getEquityIntradayData(symbol: string, isPreOpenData = false): Promise<IntradayData> {
        const details = await this.getEquityDetails(symbol.toUpperCase())
        const identifier = details.info.identifier
        let url = `/api/chart-databyindex?index=${identifier}`
        if (isPreOpenData)
            url += '&preopen=true'
        return this.getDataByEndpoint(url)
    }
    /**
     * 
     * @param symbol 
     * @param range 
     * @returns 
     */
    async getEquityHistoricalData(symbol: string, range?: DateRange): Promise<EquityHistoricalData[]> {
        const data = await this.getEquityDetails(symbol.toUpperCase())
        const activeSeries = data.info.activeSeries.length ? data.info.activeSeries[0] : /* istanbul ignore next */ 'EQ'
        if (!range) {
            range = { start: new Date(data.metadata.listingDate), end: new Date() }
        }
        const dateRanges = getDateRangeChunks(range.start, range.end, 66)
        const promises = dateRanges.map(async (dateRange) => {
            const url = `/api/historical/cm/equity?symbol=${encodeURIComponent(symbol.toUpperCase())}` +
                `&series=[%22${activeSeries}%22]&from=${dateRange.start}&to=${dateRange.end}`
            return this.getDataByEndpoint(url)
        })
        return Promise.all(promises)
    }
    /**
     * 
     * @param symbol 
     * @returns 
     */
    getEquitySeries(symbol: string): Promise<SeriesData> {
        return this.getDataByEndpoint(`/api/historical/cm/equity/series?symbol=${encodeURIComponent(symbol
            .toUpperCase())}`)
    }
    /**
     * 
     * @param index 
     * @returns 
     */
    getEquityStockIndices(index: string): Promise<IndexDetails> {
        return this.getDataByEndpoint(`/api/equity-stockIndices?index=${encodeURIComponent(index.toUpperCase())}`)
    }
    /**
     * 
     * @param index 
     * @param isPreOpenData 
     * @returns 
     */
    getIndexIntradayData(index: string, isPreOpenData = false): Promise<IntradayData> {
        let endpoint = `/api/chart-databyindex?index=${index.toUpperCase()}&indices=true`
        if (isPreOpenData)
            endpoint += '&preopen=true'
        return this.getDataByEndpoint(endpoint)
    }
    /**
     * 
     * @param index 
     * @param range 
     * @returns 
     */
    async getIndexHistoricalData(index: string, range: DateRange): Promise<IndexHistoricalData[]> {
        const dateRanges = getDateRangeChunks(range.start, range.end, 66)
        const promises = dateRanges.map(async (dateRange) => {
            const url = `/api/historical/indicesHistory?indexType=${encodeURIComponent(index.toUpperCase())}` +
                `&from=${dateRange.start}&to=${dateRange.end}`
            return this.getDataByEndpoint(url)
        })
        return Promise.all(promises)
    }

    /**
     * 
     * @param indexSymbol 
     * @returns 
     */
    getIndexOptionChain(indexSymbol: string): Promise<OptionChainData> {
        return this.getDataByEndpoint(`/api/option-chain-indices?symbol=${encodeURIComponent(indexSymbol
            .toUpperCase())}`)
    }

    /**
     * 
     * @param symbol 
     * @returns 
     */
    getEquityOptionChain(symbol: string): Promise<OptionChainData> {
        return this.getDataByEndpoint(`/api/option-chain-equities?symbol=${encodeURIComponent(symbol
            .toUpperCase())}`)
    }
    
    /**
         * 
         * @param symbol 
         * @returns 
         */
    getCommodityOptionChain(symbol: string): Promise<OptionChainData> {
        return this.getDataByEndpoint(`/api/option-chain-com?symbol=${encodeURIComponent(symbol
            .toUpperCase())}`)
    }

    /**
     * Get NSE glossary content
     * @returns Glossary content
     */
    getGlossary(): Promise<Glossary> {
        return this.getDataByEndpoint(ApiList.GLOSSARY)
    }

    /**
     * Get trading holidays
     * @returns List of trading holidays
     */
    getTradingHolidays(): Promise<Holiday[]> {
        return this.getDataByEndpoint(ApiList.HOLIDAY_TRADING)
    }

    /**
     * Get clearing holidays
     * @returns List of clearing holidays
     */
    getClearingHolidays(): Promise<Holiday[]> {
        return this.getDataByEndpoint(ApiList.HOLIDAY_CLEARING)
    }

    /**
     * Get market status
     * @returns Current market status
     */
    getMarketStatus(): Promise<MarketStatus> {
        return this.getDataByEndpoint(ApiList.MARKET_STATUS)
    }

    /**
     * Get market turnover
     * @returns Market turnover data
     */
    getMarketTurnover(): Promise<MarketTurnover> {
        return this.getDataByEndpoint(ApiList.MARKET_TURNOVER)
    }

    /**
     * Get all indices
     * @returns List of all indices
     */
    getAllIndices(): Promise<IndexDetails[]> {
        return this.getDataByEndpoint(ApiList.ALL_INDICES)
    }

    /**
     * Get index names
     * @returns List of index names
     */
    getIndexNames(): Promise<IndexName[]> {
        return this.getDataByEndpoint(ApiList.INDEX_NAMES)
    }

    /**
     * Get circulars
     * @returns List of circulars
     */
    getCirculars(): Promise<Circular[]> {
        return this.getDataByEndpoint(ApiList.CIRCULARS)
    }

    /**
     * Get latest circulars
     * @returns List of latest circulars
     */
    getLatestCirculars(): Promise<Circular[]> {
        return this.getDataByEndpoint(ApiList.LATEST_CIRCULARS)
    }

    /**
     * Get equity master
     * @returns Equity master data with categorized indices
     */
    getEquityMaster(): Promise<EquityMaster> {
        return this.getDataByEndpoint(ApiList.EQUITY_MASTER)
    }

    /**
     * Get pre-open market data
     * @returns Pre-open market data
     */
    getPreOpenMarketData(): Promise<PreOpenMarketData[]> {
        return this.getDataByEndpoint(ApiList.MARKET_DATA_PRE_OPEN)
    }

    /**
     * Get merged daily reports for capital market
     * @returns Daily reports for capital market
     */
    getMergedDailyReportsCapital(): Promise<DailyReport[]> {
        return this.getDataByEndpoint(ApiList.MERGED_DAILY_REPORTS_CAPITAL)
    }

    /**
     * Get merged daily reports for derivatives
     * @returns Daily reports for derivatives
     */
    getMergedDailyReportsDerivatives(): Promise<DailyReport[]> {
        return this.getDataByEndpoint(ApiList.MERGED_DAILY_REPORTS_DERIVATIVES)
    }

    /**
     * Get merged daily reports for debt market
     * @returns Daily reports for debt market
     */
    getMergedDailyReportsDebt(): Promise<DailyReport[]> {
        return this.getDataByEndpoint(ApiList.MERGED_DAILY_REPORTS_DEBT)
    }
}
