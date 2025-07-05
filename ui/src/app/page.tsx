'use client'

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Deposit</h2>
          {/* Deposit content will go here */}
        </section>
        <section className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Withdraw</h2>
          {/* Withdraw content will go here */}
        </section>
      </div>
    </main>
  )
}
