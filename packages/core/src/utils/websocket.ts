type Callback = (message: unknown) => void

export class WebSocketManager {
  private url: string
  private ws: WebSocket | null
  private subscriptions: Map<string, Callback>
  private maxRetries: number
  private retryCount: number
  private retryDelay: number
  private isConnected: boolean

  constructor(url: string) {
    this.url = url
    this.ws = null
    this.subscriptions = new Map<string, Callback>()
    this.maxRetries = 5
    this.retryCount = 0
    this.retryDelay = 2000 // Initial retry delay in milliseconds
    this.isConnected = false

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleWindowFocus.bind(this))
    }
  }

  connect(): void {
    if (this.isConnected || this.ws) {
      console.warn('WebSocket connection attempt aborted: already connected.')
      return
    }

    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', () => {
      console.log('[Price Reporter] WebSocket connected.')
      this.isConnected = true
      this.retryCount = 0
      this.resubscribeAll()
    })

    this.ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (this.subscriptions.has(data.topic)) {
          const callback = this.subscriptions.get(data.topic)
          if (callback) {
            callback(data.price)
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    this.ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
    })

    this.ws.addEventListener('close', () => {
      console.log(
        '[Price Reporter] WebSocket closed. Attempting to reconnect...',
      )
      this.isConnected = false
      this.ws = null
      this.reconnect()
    })
  }

  private reconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      console.error('[Price Reporter] Maximum reconnect attempts reached.')
      return
    }
    const backoffDelay = this.retryDelay * 2 ** this.retryCount
    const jitter = Math.random() * backoffDelay * 0.3 // Jitter up to 30% of the backoff delay
    const delayWithJitter = backoffDelay + jitter

    setTimeout(() => {
      console.log(
        `[Price Reporter] Reconnecting attempt ${this.retryCount + 1}`,
      )
      this.retryCount++
      this.connect()
    }, delayWithJitter)
  }

  private handleWindowFocus(): void {
    if (!this.isConnected) {
      console.log(
        '[Price Reporter] Window refocused. Attempting to reconnect...',
      )
      this.retryCount = 0
      this.reconnect()
    }
  }

  subscribe(topic: string, callback: Callback): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, callback)
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ method: 'subscribe', topic }))
      }
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((_, topic) => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ method: 'subscribe', topic }))
      }
    })
  }

  close(): void {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
      this.ws = null
    }
  }
}
