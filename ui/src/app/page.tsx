'use client'

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Deposit BTC for sovaBTC
          </h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="deposit-amount"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Amount (satoshis)
              </label>
              <input
                id="deposit-amount"
                type="number"
                required
                placeholder="e.g. 100000"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="deposit-tx"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Signed BTC Transaction (hex)
              </label>
              <input
                id="deposit-tx"
                type="text"
                required
                placeholder="Paste the signed transaction hex"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="deposit-index"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Output Index
              </label>
              <input
                id="deposit-index"
                type="number"
                required
                placeholder="e.g. 0"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              Deposit
            </button>
          </form>
        </section>
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Withdraw sovaBTC to BTC
          </h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="withdraw-amount"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Amount (satoshis)
              </label>
              <input
                id="withdraw-amount"
                type="number"
                required
                placeholder="e.g. 100000"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-gas"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                BTC Gas Limit (satoshis)
              </label>
              <input
                id="withdraw-gas"
                type="number"
                required
                placeholder="e.g. 500"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-height"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                BTC Block Height
              </label>
              <input
                id="withdraw-height"
                type="number"
                required
                placeholder="e.g. 820000"
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <div>
              <label
                htmlFor="withdraw-address"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Destination BTC Address
              </label>
              <input
                id="withdraw-address"
                type="text"
                required
                placeholder="bc1..."
                className="w-full border border-gray-600 bg-gray-700 text-white rounded px-3 py-2 placeholder-gray-400"
              />
            </div>
            <button
              type="button"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              Withdraw
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
