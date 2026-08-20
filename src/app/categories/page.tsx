import Link from "next/link";

export default function CategoriesPage() {
  const categories = [
    {
      id: 1,
      name: "کالای دیجیتال",
      nameFa: "کالای دیجیتال",
      icon: "📱",
      description: "تجهیزات الکترونیکی، موبایل، لپ‌تاپ و قطعات",
      requests: 1250,
      sellers: 340,
      subcategories: ["موبایل", "لپ‌تاپ", "مانیتور", "قطعات کامپیوتر"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 2,
      name: "مد و پوشاک",
      nameFa: "مد و پوشاک",
      icon: "👕",
      description: "خرید عمده پوشاک، کیف و کفش و اکسسوری",
      requests: 890,
      sellers: 210,
      subcategories: ["لباس مردانه", "لباس زنانه", "کفش ورزشی", "اکسسوری"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 3,
      name: "خانه و آشپزخانه",
      nameFa: "خانه و آشپزخانه",
      icon: "🏠",
      description: "تجهیزات خانگی، دکوراسیون و لوازم پخت و پز",
      requests: 654,
      sellers: 180,
      subcategories: ["لوازم برقی", "ظروف", "دکوراسیون", "فرش"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 4,
      name: "زیبایی و سلامت",
      nameFa: "زیبایی و سلامت",
      icon: "💄",
      description: "محصولات آرایشی، بهداشتی و مراقبت شخصی",
      requests: 432,
      sellers: 120,
      subcategories: ["آرایشی", "مراقبت پوست", "عطر و ادکلن", "لوازم بهداشتی"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 5,
      name: "کتاب و لوازم تحریر",
      nameFa: "کتاب و لوازم تحریر",
      icon: "📚",
      description: "کتب چاپی، نوشت‌افزار و تجهیزات آموزشی",
      requests: 321,
      sellers: 95,
      subcategories: ["کتاب درسی", "نوشت‌افزار", "لوازم اداری", "لوازم مهندسی"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 6,
      name: "ورزش و سفر",
      nameFa: "ورزش و سفر",
      icon: "⚽",
      description: "لوازم ورزشی، تجهیزات کمپینگ و لباس ورزشی",
      requests: 567,
      sellers: 150,
      subcategories: ["لوازم ورزشی", "تجهیزات سفر", "دوچرخه", "پوشاک ورزشی"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 7,
      name: "اسباب‌بازی و کودک",
      nameFa: "اسباب‌بازی و کودک",
      icon: "🧸",
      description: "اسباب‌بازی، بازی فکری، سیسمونی و لباس کودک",
      requests: 445,
      sellers: 110,
      subcategories: ["اسباب‌بازی", "بازی فکری", "سیسمونی", "پوشاک کودک"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
    {
      id: 8,
      name: "خودرو و موتور",
      nameFa: "خودرو و موتور",
      icon: "🚗",
      description: "لوازم یدکی، تجهیزات ایمنی و مصرفی خودرو",
      requests: 289,
      sellers: 78,
      subcategories: ["لوازم یدکی", "مصرفی خودرو", "تجهیزات ایمنی", "لوازم موتور"],
      color: "from-[#003b5c] to-[#00a8e8]",
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">دسته‌بندی‌ها</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            درخواست خرید کالای خود را در دسته‌بندی مناسب ثبت کنید یا فروشندگان فعال آن حوزه را ببینید
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
                {category.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{category.nameFa}</h3>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {category.subcategories.slice(0, 3).map((sub, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    {sub}
                  </span>
                ))}
                {category.subcategories.length > 3 && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    +{category.subcategories.length - 3}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  <span className="font-bold text-[#00a8e8]">{category.requests.toLocaleString()}</span> درخواست
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-bold text-[#0b9c56]">{category.sellers.toLocaleString()}</span> تامین‌کننده
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-l from-green-600 to-green-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">دسته‌بندی مورد نظر خود را پیدا نکردید؟</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            ما همیشه در حال گسترش دسته‌بندی‌های خود هستیم. اگر دسته‌بندی خاصی مد نظر دارید، با ما تماس بگیرید.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/post-project"
              className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold hover:bg-green-50 transition"
            >
              ثبت درخواست خرید
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-green-700 transition"
            >
              تماس با ما
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
