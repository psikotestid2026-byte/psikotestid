import { DiscScoreResult } from './disc';

export interface DiscProfileInterpretation {
  typeCode: string;
  typeName: string;
  generalDescription: string;
  strengthsNarrative: string; // Narasi mendalam kekuatan
  strengths: string[];
  weaknessesNarrative: string; // Narasi mendalam area pengembangan
  weaknesses: string[];
  rolesNarrative: string; // Narasi mendalam proyeksi posisi/profesi/bidang
  recommendedRoles: string[];
  conflictsNarrative: string; // Narasi mendalam potensi konflik & solusinya
  potentialConflicts: {
    trigger: string;
    impact: string;
    solution: string;
  }[];
  treatmentsNarrative: string; // Narasi mendalam treatment terbaik HR & Atasan
  bestTreatments: string[];
  communicationStyle: string;
  idealEnvironment: string;
  hrManagementGuide: string[];
}

export const DISC_PROFILES: Record<string, DiscProfileInterpretation> = {
  D: {
    typeCode: 'D',
    typeName: 'Dominance (The Commander / Establisher)',
    generalDescription: 'Individu dengan tipe kepribadian Dominance (D) merupakan sosok yang highly self-motivated, berorientasi sangat kuat pada hasil (result-oriented), tegas, dan tidak ragu mengambil alih kendali saat situasi berada dalam ketidakpastian. Mereka memandang pekerjaan sebagai arena kompetisi dan tantangan yang harus dimenangkan secara efektif, efisien, dan dalam tempo yang sesingkat-singkatnya. Pribadi dengan profil D murni memiliki dorongan bawaan untuk memimpin, mendominasi lingkungan, dan mengubah status quo. Mereka tidak menyukai rutinitas yang monoton atau prosedur birokratis yang dianggap memperlambat pencapaian tujuan. Fokus utama mereka adalah penyelesaian masalah secara pragmatis, berani mengambil risiko yang telah diperhitungkan, dan memiliki resiliensi tinggi terhadap tekanan atau krisis. Mereka adalah agen perubahan yang agresif namun strategis.',
    rolesNarrative: 'Berdasarkan dorongan kepemimpinan yang berani dan fokus pada hasil akhir, kandidat ini memiliki proyeksi kecocokan yang sangat tinggi untuk ditempatkan pada posisi strategis atau kepemimpinan operasional puncak yang menuntut pengambilan keputusan cepat. Mereka berkembang pesat di bidang bisnis yang dinamis, berisiko tinggi, atau pada fase pemulihan situasi krisis (turnaround management). Di industri seperti manufaktur, konstruksi, pertambangan, atau perbankan investasi, mereka sangat efektif dalam memimpin ekspansi atau merestrukturisasi organisasi. Mereka kurang cocok di posisi staf administrasi atau peran pendukung yang pasif, melainkan harus berada di garis depan eksekusi strategi. Sebagai pemimpin, mereka secara alami akan mengambil posisi sebagai penentu arah perusahaan, menggerakkan seluruh divisi untuk mencapai target finansial dan operasional dengan agresivitas yang tinggi.',
    recommendedRoles: [
      'Eksekutif / Chief Executive Officer (CEO) / General Manager',
      'Project Director / Crisis Management & Turnaround Officer',
      'Head of Sales & Commercial Operations',
      'Business Developer Lead / Entrepreneurial Unit Leader'
    ],
    strengthsNarrative: 'Kandidat memiliki keberanian luar biasa dalam membuat keputusan krusial di bawah tekanan berat tanpa terjebak dalam keraguan (decisiveness). Motivasi internal mereka yang amat tinggi mendorong mereka beserta timnya untuk terus bergerak melampaui batas zona nyaman demi mencapai Key Performance Indicators (KPI) yang agresif. Mereka sangat handal dalam menyederhanakan masalah yang rumit menjadi langkah-langkah aksi yang jelas dan pragmatis. Kemandirian (independence) adalah salah satu kekuatan terbesar mereka; mereka tidak memerlukan pengawasan ketat untuk mulai bergerak. Selain itu, mereka memiliki stamina mental yang kuat saat menghadapi penolakan atau hambatan eksternal, melihat kegagalan sementara bukan sebagai akhir, melainkan sebagai tantangan yang harus ditaklukkan dengan pendekatan baru.',
    strengths: [
      'Berani mengambil risiko dan keputusan strategis secara cepat di bawah tekanan tinggi',
      'Fokus luar biasa tinggi pada pencapaian target strategis, efisiensi, dan hasil akhir',
      'Mampu mengatasi hambatan struktural dan resistensi tanpa keraguan dalam eksekusi',
      'Memiliki dorongan kepemimpinan alami dan daya juang (resiliensi) yang tak kenal lelah'
    ],
    weaknessesNarrative: 'Dalam upayanya mengejar kecepatan dan efisiensi absolut, kandidat berisiko tinggi terkesan terlalu otoriter, kurang sabar terhadap anggota tim yang membutuhkan proses belajar bertahap, dan terkadang mengabaikan faktor nuansa emosional dalam komunikasi interpersonal. Gaya kepemimpinan mereka yang instruktif dan mendikte dapat menekan kreativitas tim atau memicu rasa takut berbuat salah di kalangan bawahan. Kelemahan lainnya adalah kecenderungan untuk mengambil jalan pintas (bypassing procedures) yang mengabaikan detail prosedur operasional standar (SOP) demi hasil yang serba cepat. Hal ini dapat berujung pada celah kepatuhan (compliance) atau risiko operasional. Selain itu, mereka seringkali mendominasi forum diskusi, enggan mendengar masukan yang dianggap bertele-tele, dan bisa secara tidak sengaja merendahkan opini orang lain yang berlawanan dengan pandangan pragmatisnya.',
    weaknesses: [
      'Sangat rentan terkesan terlalu dominan, otoriter, dan kurang bersikap empatik terhadap bawahan',
      'Sering mengabaikan detail prosedur, regulasi internal, atau SOP demi kecepatan eksekusi',
      'Cenderung mendominasi forum, menginterupsi, dan enggan mendengar masukan secara komprehensif'
    ],
    conflictsNarrative: 'Potensi konflik utama bagi tipe D muncul apabila kebebasan bertindaknya dibatasi oleh sistem mikro-manajemen yang ketat, aturan birokrasi yang kaku, atau dipimpin oleh atasan yang ragu-ragu dan lamban dalam mengeksekusi strategi. Hal ini dapat memicu respons konfrontatif secara terbuka, perdebatan keras, atau penolakan terselubung terhadap wewenang (insubordinasi). Jika ditempatkan dalam lingkungan kerja yang pasif dan lambat, kandidat tipe D akan merasa sangat frustrasi, yang sering diekspresikan melalui kemarahan atau sindiran tajam kepada rekan kerja. Untuk mengatasi hal ini, solusi utamanya adalah menggeser fokus mereka dari proses menuju hasil. Berikan mereka tantangan independen yang besar, tentukan batasan wewenang yang tegas sejak awal, namun biarkan mereka menentukan \'cara\' untuk mencapai tujuan tersebut tanpa campur tangan teknis berlebihan.',
    potentialConflicts: [
      {
        trigger: 'Instruksi yang bersifat mikro-manajemen, birokrasi berlebihan, atau atasan yang lamban.',
        impact: 'Kandidat akan bersikap kritis, menantang wewenang secara frontal, atau menjadi sangat frustrasi.',
        solution: 'Berikan otonomi dengan batas keputusan yang jelas, fokus pada penilaian hasil akhir, bukan metode kerja.'
      },
      {
        trigger: 'Perdebatan opini dalam rapat yang berbelit-belit tanpa menghasilkan rencana aksi (action plan) nyata.',
        impact: 'Kandidat dapat mengambil keputusan sepihak tanpa konsensus atau meninggalkan diskusi.',
        solution: 'Tetapkan tenggat waktu diskusi yang ringkas dan izinkan mereka memimpin eksekusi setelah keputusan diambil.'
      }
    ],
    treatmentsNarrative: 'Treatment terbaik untuk memaksimalkan potensi kandidat adalah dengan memberikan ruang otonomi yang sangat luas disertai kejelasan Key Performance Indicators (KPI) yang terukur dan menantang. Atasan, HR, maupun manajemen puncak hendaknya berkomunikasi secara sangat lugas, berorientasi pada fakta, dan langsung ke inti permasalahan (to the point) tanpa banyak pendahuluan. Mereka sangat menghargai atasan yang kompeten, kuat, dan menghargai kemandirian mereka. Apresiasi terbaik bagi mereka bukanlah sekadar pujian verbal, melainkan promosi wewenang, bonus finansial berbasis kinerja, atau kepercayaan untuk memegang proyek berskala lebih besar. Penting bagi manajemen untuk secara berkala melakukan coaching yang berfokus pada pengembangan kecerdasan emosional (EQ) mereka, agar agresivitas mereka dapat diimbangi dengan kemampuan membangun tim yang harmonis.',
    bestTreatments: [
      'Bicaralah secara to-the-point dengan fakta dan hasil konkret, tanpa basa-basi yang panjang atau emosional.',
      'Berikan delegasi wewenang yang luas dan tantang mereka dengan target-target baru yang sulit dicapai.',
      'Lakukan coaching untuk meningkatkan empati manajerial tanpa mengurangi dorongan kompetitif mereka.'
    ],
    communicationStyle: 'Sangat lugas (direct), to-the-point, berorientasi pada solusi, asertif, dan terkadang bersifat memerintah (commanding).',
    idealEnvironment: 'Lingkungan yang serba cepat, dinamis, kompetitif, minim birokrasi, dan memberikan ruang otonomi untuk mengarahkan orang lain.',
    hrManagementGuide: [
      'Fasilitasi ruang otonomi yang luas yang dibarengi dengan KPI yang sangat ketat dan objektif.',
      'Sediakan program pelatihan kepemimpinan yang berfokus pada empati, active listening, dan people management.',
      'Berikan penugasan yang menantang dan beri wewenang untuk merombak sistem yang tidak efisien.'
    ]
  },
  DI: {
    typeCode: 'DI',
    typeName: 'Dominance-Influence (The Concluder / Persuasive Leader)',
    generalDescription: 'Individu dengan profil Dominance-Influence (DI) adalah sosok eksekutif karismatik yang menggabungkan dorongan kuat untuk mencapai hasil (D) dengan kecakapan komunikasi interpersonal yang sangat persuasif, antusias, dan inspiratif (I). Mereka merupakan inisiator pergerakan yang berani tampil di depan publik, memiliki energi yang melimpah, serta mahir mengajak orang lain bergerak bersama menuju visi strategis yang ditetapkan. Tidak seperti tipe D murni yang bisa terkesan dingin, tipe DI mampu mencairkan suasana dengan humor dan kehangatan, namun tetap mempertahankan otoritas dan fokus pada tujuan bisnis. Mereka sangat berbakat dalam membaca motivasi orang lain dan memanfaatkannya untuk mendorong performa tim. Pribadi ini sangat menyukai sorotan (spotlight), tantangan kompetitif, dan kesempatan untuk memperluas jejaring pengaruh (networking).',
    rolesNarrative: 'Kandidat DI diproyeksikan sangat sukses menempati posisi kepemimpinan lini depan yang menuntut perpaduan antara ketajaman negosiasi bisnis, ekspansi pasar agresif, dan motivasi tim secara langsung. Mereka sangat bersinar di bidang Sales B2B/B2C skala besar, Marketing Strategis, Public Relations, Hubungan Pemerintahan (Government Relations), dan posisi Business Development. Kemampuan mereka dalam membangun relasi dengan klien tingkat eksekutif sambil memastikan closing target penjualan menjadikan mereka ujung tombak perusahaan. Di industri kreatif, media, atau konsultan bisnis, kandidat DI sering kali menjadi "wajah" dari organisasi. Sebaliknya, mereka tidak disarankan untuk ditempatkan di posisi back-office yang sunyi, analisis data murni, atau pekerjaan berulang, karena hal tersebut akan cepat memadamkan energi dan motivasi mereka.',
    recommendedRoles: [
      'Chief Marketing Officer / Public Relations Director',
      'Head of Business Development & Strategic Expansion',
      'Senior Sales Director / Key Account Management Lead',
      'Campaign Manager / Corporate Motivator & Trainer'
    ],
    strengthsNarrative: 'Kekuatan terbesar kandidat terletak pada daya persuasi yang luar biasa tinggi dan keberanian dalam merintis inisiatif-inisiatif baru yang belum pernah dilakukan sebelumnya. Mereka mampu memecahkan kebekuan birokrasi dan menularkan antusiasme serta optimisme tingkat tinggi kepada seluruh anggota organisasi, bahkan dalam situasi yang secara objektif terlihat suram. Kandidat DI juga merupakan negosiator yang ulung; mereka dapat membaca kebutuhan emosional dan rasional klien, lalu menyajikan penawaran dengan keyakinan yang sulit ditolak. Kecepatan mereka dalam mengambil keputusan strategis dibarengi dengan kelincahan adaptasi sosial membuat mereka sanggup mengelola konflik interpersonal dalam tim secara elegan tanpa kehilangan fokus pada target akhir.',
    strengths: [
      'Daya persuasi dan karisma kepemimpinan yang luar biasa dalam memobilisasi tim skala besar',
      'Inisiatif tinggi dalam membuka pasar baru dan keberanian dalam mengambil risiko inovatif',
      'Negosiator yang ulung dengan kemampuan membaca dan memanipulasi dinamika sosial',
      'Mampu menjaga optimisme dan energi positif di tengah tekanan target yang masif'
    ],
    weaknessesNarrative: 'Kelemahan paling mencolok dari kandidat ini adalah kecenderungan bertindak impulsif dan membuat komitmen besar berdasarkan antusiasme sesaat tanpa melakukan analisis kelayakan (feasibility study) yang mendalam. Mereka cepat merasa bosan, bahkan muak, terhadap rutinitas administrasi, dokumentasi, dan detail operasional. Hal ini sering mengakibatkan eksekusi ide-ide brilian mereka terbengkalai karena kurangnya tindak lanjut yang sistematis. Mereka juga terkadang terlalu optimis (over-optimistic) dalam memperhitungkan estimasi waktu, anggaran, dan kapasitas sumber daya tim, sehingga seringkali menjanjikan target penyelesaian yang tidak realistis kepada klien atau manajemen atas.',
    weaknesses: [
      'Sangat rentan bertindak impulsif dan terburu-buru tanpa analisis detail teknis yang komprehensif',
      'Cepat merasa bosan dan cenderung mengabaikan tugas administrasi, pelaporan, atau dokumentasi rinci',
      'Over-optimistic dalam memproyeksikan target waktu dan sumber daya, memicu risiko over-promise'
    ],
    conflictsNarrative: 'Konflik yang signifikan biasanya terjadi apabila kandidat dipaksa mengerjakan tugas-tugas klerikal atau diikat dalam prosedur kerja yang sangat kaku, lamban, dan terisolasi dari interaksi manusiawi. Jika lingkungan kerja terlalu birokratis dan tidak menghargai ekspresi ide kreatif, kandidat akan memberontak atau performanya akan anjlok drastis. Konflik juga dapat timbul dengan divisi kontrol (seperti Keuangan atau QA) yang menuntut bukti rinci sebelum menyetujui ide agresif mereka. Solusi untuk konflik semacam ini adalah dengan menyinergikan mereka bersama staf pendukung operasional (co-pilot) yang kuat dalam hal ketelitian dan administrasi. Dengan demikian, kandidat DI dapat fokus pada strategi makro dan negosiasi eksternal, sementara operasional mikro dijaga oleh rekannya.',
    potentialConflicts: [
      {
        trigger: 'Tuntutan penyelesaian administrasi rinci jangka panjang atau berada di bawah manajemen otoriter kaku.',
        impact: 'Kandidat akan kehilangan motivasi secara dramatis, menjadi resisten, dan berpotensi resign.',
        solution: 'Sediakan asisten/staf operasional pendukung dan berikan panggung untuk tampil memimpin presentasi.'
      }
    ],
    treatmentsNarrative: 'Treatment terbaik untuk mempertahankan kinerja optimal kandidat DI adalah dengan memberikan pengakuan sosial (social recognition), pujian publik, dan panggung apresiasi atas pencapaian besar mereka. Mereka dimotivasi oleh prestise, status, dan kebebasan untuk berekspresi. Manajemen hendaknya mengarahkan ide-ide makro mereka ke dalam rencana aksi yang dipecah menjadi target-target berjangka pendek agar momentum eksekusi terjaga. Dalam memberikan kritik, HR atau atasan harus menggunakan pendekatan sandwich (pujian-kritik-pujian) dan menghindari mempermalukan mereka di depan umum. Fasilitasi mereka dengan sumber daya tim operasional yang mumpuni agar visi besar mereka dapat diterjemahkan menjadi kenyataan operasional tanpa memaksa kandidat melakukan detail teknisnya sendiri.',
    bestTreatments: [
      'Berikan apresiasi publik, penghargaan, dan pengakuan status atas keberhasilan inisiatifnya.',
      'Sediakan tim support administratif untuk menutupi kelemahan mereka pada detail dan tindak lanjut.',
      'Arahkan energi kreatif mereka pada target kompetitif jangka pendek agar mereka tidak mudah kehilangan fokus.'
    ],
    communicationStyle: 'Sangat persuasif, bersemangat, karismatik, inspiratif, cepat, dan gemar menggunakan bahasa yang visioner.',
    idealEnvironment: 'Lingkungan yang memberikan publisitas, interaksi sosial intensif, dinamika bisnis tinggi, dan ruang untuk memimpin pergerakan besar.',
    hrManagementGuide: [
      'Berikan tantangan target tinggi yang dibarengi dengan dukungan infrastruktur tim operasional di belakangnya.',
      'Bantu mereka memilah antara ide yang sekadar "menarik" dan ide yang secara finansial "layak" dieksekusi.',
      'Fasilitasi pengembangan kepemimpinan yang lebih sistematis dan inklusif terhadap keberagaman gaya kerja bawahan.'
    ]
  },
  DC: {
    typeCode: 'DC',
    typeName: 'Dominance-Compliance (The Challenger / Quality Controller)',
    generalDescription: 'Kandidat tipe Dominance-Compliance (DC) merupakan sosok pemimpin analitis yang menetapkan standar sangat tinggi, baik untuk kecepatan pencapaian target (D) maupun untuk akurasi dan kualitas kerja (C). Mereka adalah individu yang sangat tegas, berpijak teguh pada fakta, data kuantitatif, dan logika absolut, serta sama sekali tidak toleran terhadap kecerobohan, ketidakefisienan, atau penyimpangan aturan operasional. Profil ini menggabungkan dorongan eksekusi yang kuat dengan ketelitian presisi. Mereka tidak mudah percaya pada intuisi tanpa bukti empiris, dan akan mempertanyakan, menantang, serta mengaudit setiap ide yang diajukan oleh orang lain sebelum menyetujuinya. Mereka adalah penjaga gawang kualitas sekaligus pendorong kinerja keras.',
    rolesNarrative: 'Proyeksi penempatan yang paling ideal bagi kandidat DC adalah posisi tingkat menengah hingga senior dalam manajemen operasional teknis, kontrol kualitas, audit internal, manajemen risiko, atau arsitektur sistem. Di industri manufaktur, teknologi informasi, atau konstruksi, mereka adalah kandidat emas untuk posisi Chief Technology Officer (CTO), Head of Quality Assurance, atau Direktur Kepatuhan (Compliance). Mereka unggul dalam lingkungan yang menuntut efisiensi biaya, minimalisasi risiko kesalahan, dan standardisasi proses dalam skala besar. Bidang hukum korporat dan audit keuangan juga sangat cocok karena kemampuan mereka menegakkan regulasi tanpa kompromi emosional. Mereka kurang cocok di bidang public relations atau layanan pelanggan dasar karena gaya komunikasinya yang terlalu lugas dan analitis.',
    recommendedRoles: [
      'Quality Assurance Manager / Lead Internal Auditor',
      'Chief Technology Officer / Senior Systems Architect',
      'Legal & Compliance Director / Head of Risk Management',
      'Financial Controller / Operations Efficiency Lead'
    ],
    strengthsNarrative: 'Kekuatan utama kandidat DC terletak pada kombinasi langka antara objektivitas analisis yang sangat tajam dan ketegasan luar biasa dalam mengeksekusi efisiensi. Mereka mampu mengidentifikasi akar permasalahan (root cause analysis) dalam sistem operasional yang kompleks, merancang solusi yang presisi, dan menegakkan implementasinya tanpa keraguan. Mereka memastikan mutu produk atau layanan organisasi berada jauh di atas standar rata-rata industri. Dedikasi mereka pada kebenaran faktual menjadikan mereka penasihat strategis yang sangat dapat diandalkan oleh dewan direksi, karena mereka berani menyampaikan kebenaran pahit (brutal facts) secara objektif demi menyelamatkan perusahaan dari risiko fatal.',
    strengths: [
      'Menjaga dan menegakkan standar kualitas serta akurasi hasil kerja pada tingkat tertinggi',
      'Sangat objektif, rasional, dan logis dalam memecahkan masalah struktural maupun teknis yang kompleks',
      'Berani menegakkan aturan, kepatuhan, dan efisiensi meski harus melawan arus opini populer',
      'Kemampuan memitigasi risiko strategis melalui analisis data mendalam sebelum mengeksekusi tindakan besar'
    ],
    weaknessesNarrative: 'Area pengembangan kritis kandidat berada pada risiko terjerumus ke dalam perfeksionisme yang ekstrem. Standar tinggi mereka sering kali tidak realistis untuk dicapai oleh staf biasa dalam batas waktu normal, sehingga berpotensi menciptakan lingkungan kerja yang penuh tekanan (high-stress environment). Gaya komunikasi mereka sangat kritis, dingin, dan skeptis; mereka lebih sering menunjukkan kesalahan daripada memberikan apresiasi atas keberhasilan kecil. Hal ini dapat secara perlahan menurunkan moral dan kecerdasan emosional (EQ) tim, membuat bawahan merasa tidak dihargai. Mereka juga cenderung kaku (inflexible) dan sulit menerima kompromi atas apa yang mereka yakini sebagai "standar kebenaran" teknis.',
    weaknesses: [
      'Perfeksionisme ekstrem yang dapat membebani kapasitas tim dan memperlambat laju progres keseluruhan',
      'Gaya komunikasi yang terlalu kritis, sarkastis, atau dingin, yang mengikis moral dan kehangatan tim',
      'Kurang fleksibel dan sulit bertoleransi pada kesalahan manusiawi atau kompromi operasional'
    ],
    conflictsNarrative: 'Konflik kronis sering terpicu ketika kandidat menemukan hasil kerja anggota tim yang dianggap asal jadi, tidak memenuhi kesepakatan SOP, atau ketika mereka diminta untuk menurunkan standar kualitas demi mempercepat peluncuran produk (speed vs quality dilemma). Kandidat DC akan merespons dengan teguran keras yang berpusat pada logika dan fakta, yang sering kali melukai ego atau hubungan kerja dengan divisi lain (terutama divisi Sales/Marketing yang lebih fleksibel). Untuk mengelola konflik ini, manajemen harus memfasilitasi sesi mediasi berbasis indikator kriteria objektif, dan membantu DC memahami nilai dari "Good Enough" (cukup baik) dalam konteks prioritas bisnis secara keseluruhan.',
    potentialConflicts: [
      {
        trigger: 'Hasil kerja tim yang dinilai ceroboh, tidak akurat, atau desakan manajemen untuk mengorbankan kualitas.',
        impact: 'Kandidat akan memberikan kritik pedas secara terbuka, menolak menandatangani persetujuan, dan menciptakan ketegangan.',
        solution: 'Bahas trade-off risiko secara logis menggunakan kerangka ROI (Return on Investment) dan manajemen waktu objektif.'
      }
    ],
    treatmentsNarrative: 'Pendekatan manajerial paling efektif adalah senantiasa menyajikan fakta, data konkret, dan referensi preseden saat berdiskusi dengan kandidat DC. Hindari menggunakan argumen emosional, opini subjektif, atau visi abstrak; mereka hanya akan menghormati otoritas yang dibangun atas dasar kompetensi teknis dan integritas logis. Beri mereka wewenang penuh (empowerment) dalam merancang dan mengawasi tolok ukur mutu operasional perusahaan. Sebagai HR, sangat penting untuk membimbing mereka secara privat mengenai teknik komunikasi kepemimpinan empatik—mengajarkan mereka cara membingkai (framing) kritik menjadi umpan balik konstruktif (constructive feedback) yang dapat diterima secara psikologis oleh bawahan.',
    bestTreatments: [
      'Gunakan argumen kuantitatif, bukti analitik valid, dan SOP profesional standar saat bernegosiasi atau berdiskusi.',
      'Percayakan wewenang absolut atas kontrol kualitas pada sistem operasional atau finansial yang paling vital.',
      'Sediakan pelatihan khusus mengenai kecerdasan emosional manajerial dan resolusi konflik interpersonal.'
    ],
    communicationStyle: 'Logis, analitis, kritis, skeptis, berbasis bukti faktual, dan menuntut presisi linguistik.',
    idealEnvironment: 'Manajemen kualitas tingkat lanjut, arsitektur teknis, audit keuangan presisi tinggi, dan pengendalian risiko korporat.',
    hrManagementGuide: [
      'Beri kepercayaan penuh dalam merancang standar prosedur dan pengawasan kepatuhan di level perusahaan.',
      'Bimbing mereka secara intensif untuk memberikan umpan balik yang membangun tanpa terkesan menginterogasi atau menyerang.',
      'Dorong kapasitas adaptasi untuk menerima kompromi-kompromi strategis demi kelancaran eksekusi bisnis keseluruhan.'
    ]
  },
  I: {
    typeCode: 'I',
    typeName: 'Influence (The Communicator / Motivator)',
    generalDescription: 'Tipe kepribadian Influence (I) murni merepresentasikan individu yang luar biasa ramah, hangat, antusias, ekstrovert, dan memiliki tingkat kecerdasan sosial (Social Intelligence) yang sangat tinggi. Mereka berfungsi sebagai perekat sosial dan sumber energi positif dalam organisasi. Mereka memiliki bakat alami untuk mencairkan suasana kaku, membangun koneksi interpersonal dalam hitungan menit, dan menularkan optimisme visi kepada semua orang di sekitarnya. Individu I sangat menghargai interaksi manusiawi, persahabatan di tempat kerja, dan pengakuan sosial. Mereka cenderung menghindari isolasi, konflik terpendam, atau lingkungan kerja yang kaku dan terlalu berbasis aturan (rule-bound). Motivasi utama mereka adalah penerimaan kelompok, panggung untuk berekspresi, dan kebebasan mengeksplorasi ide-ide kreatif melalui diskusi interaktif.',
    rolesNarrative: 'Kandidat I diproyeksikan sangat berhasil, secara alami dan konsisten, dalam profesi yang mengandalkan soft-skills tingkat tinggi: komunikasi massa, negosiasi berorientasi relasi (relationship-based), manajemen SDM sisi afektif, maupun pemasaran kreatif. Posisi sebagai Corporate Trainer, Event Manager, atau Public Relations Specialist adalah arena bermain sempurna bagi mereka. Di bidang HR, mereka sangat tepat menangani Employee Relations, Employer Branding, atau Rekrutmen, di mana impresi pertama dan kemampuan membangun ikatan emosional menjadi kunci keberhasilan. Di ranah Sales, mereka unggul dalam account management jangka panjang yang membutuhkan maintenance hubungan batin dengan klien. Mereka harus dihindarkan dari pekerjaan soliter seperti entri data masif, pengkodean sistem tanpa tim, atau akuntansi murni.',
    recommendedRoles: [
      'Human Resources Business Partner / Employee Relation Manager',
      'Corporate Communications Specialist / Public Relations Lead',
      'Key Account Executive / Customer Relationship Manager',
      'Event Manager / Corporate Trainer & Facilitator'
    ],
    strengthsNarrative: 'Kelebihan paling fundamental dari kandidat ini terletak pada kemampuan diplomasi dan lobi yang amat luwes; mereka dapat memenangkan hati orang yang paling skeptis sekalipun. Kemudahan mereka dalam beradaptasi dengan berbagai karakteristik kepribadian membuat mereka menjadi fasilitator lintas divisi yang sangat andal. Bakat alami dalam memotivasi, menyemangati, dan menginspirasi semangat tim menjadi aset berharga saat perusahaan sedang menghadapi masa-masa moral rendah atau kejenuhan. Mereka juga sangat kreatif dan memiliki cara berpikir yang di luar kebiasaan (out-of-the-box) ketika melakukan curah pendapat (brainstorming), sering kali melahirkan inisiatif-inisiatif penyelesaian masalah yang tidak terduga dan inovatif.',
    strengths: [
      'Kemampuan diplomasi, public speaking, dan komunikasi massa yang sangat memikat serta persuasif',
      'Fasilitator ulung yang mampu memotivasi, meredakan ketegangan, dan membangun optimisme moral tim',
      'Kreativitas tingkat tinggi yang kaya akan gagasan segar dalam interaksi dan pemecahan masalah sosial',
      'Kecerdasan emosional yang baik dalam membaca dan menyesuaikan diri dengan suasana audiens'
    ],
    weaknessesNarrative: 'Tantangan terbesar kandidat I adalah kelemahan signifikan pada aspek ketelitian, dokumentasi administrasi, dan konsistensi pada prosedur operasional teknis. Karena orientasi mereka adalah menyenangkan orang lain dan menjaga keharmonisan hubungan, mereka sangat cenderung untuk berjanji berlebihan (over-promising) mengenai tenggat waktu atau kapasitas teknis. Mereka sering kali kehilangan fokus dan mudah teralihkan perhatiannya (distracted) saat bekerja di lingkungan yang menuntut konsentrasi sepi tanpa interaksi. Manajemen waktu adalah isu kronis; mereka mungkin datang terlambat atau melewati tenggat waktu karena terlalu asyik bersosialisasi atau membantu masalah personal rekan kerjanya.',
    weaknesses: [
      'Sangat lemah dan rentan melakukan kesalahan dalam tugas administrasi rinci, pelaporan, dan dokumentasi terstruktur',
      'Mudah kehilangan fokus, rentan terhadap distraksi, dan kesulitan menjaga konsistensi jadwal kerja yang ketat',
      'Kecenderungan untuk mengumbar janji berlebihan (over-promising) semata-mata demi menjaga hubungan baik emosional'
    ],
    conflictsNarrative: 'Kondisi konflik batin dan stres berat pada tipe I akan terpicu jika mereka diisolasi secara fisik maupun sosial dari rekan kerja, atau dipaksa beroperasi dalam iklim organisasi yang serba kaku, dingin, dan dikontrol ketat oleh aturan mikromanajemen (strict micromanagement). Demotivasi juga terjadi jika kontribusi ide verbal mereka diabaikan. Ketika tertekan, mereka dapat menjadi sarkastis, kehilangan keceriaannya sama sekali, atau secara aktif mengeluhkan lingkungan kerjanya ke pihak lain (gosip/venting). Solusinya adalah secara proaktif melibatkan mereka dalam forum-forum diskusi kelompok, kepanitiaan bersama, serta menyeimbangkan tugas mandiri mereka dengan proyek kolaboratif lintas departemen.',
    potentialConflicts: [
      {
        trigger: 'Penempatan di lingkungan kerja yang sangat terisolasi, kaku, dan minim interaksi sosial.',
        impact: 'Kandidat mengalami demotivasi parah, produktivitas anjlok, dan dapat mencari pelarian sosial negatif.',
        solution: 'Desain rutinitas kerja harian yang mengharuskan check-in sosial, kerja kelompok (pair work), atau presentasi rutin.'
      }
    ],
    treatmentsNarrative: 'Treatment dan pendekatan manajerial terbaik adalah menciptakan atmosfer bimbingan yang bersahabat, terbuka, komunikatif, dan penuh kehangatan emosional. Atasan harus meluangkan waktu untuk mendengarkan cerita dan ide mereka sebelum masuk ke pembahasan kinerja. Karena mereka kesulitan mengorganisir waktu mandiri, HR dan Manajemen perlu mendesain sistem "pengingat tenggat waktu" (reminder system) secara ramah tanpa terkesan mengintimidasi (misalnya melalui daily stand-up meeting yang santai). Berikan umpan balik positif secara terbuka (public praise) dan teguran secara empatik di ruang tertutup. Pasangkan mereka dengan kolega dari tipe S atau C yang dapat membantu merapikan administrasi dan menjaga struktur alur kerja proyek mereka.',
    bestTreatments: [
      'Ciptakan suasana interaksi kerja dan rapat yang ramah, hangat, apresiatif, dan komunikatif.',
      'Sediakan dukungan struktural ringan atau software manajemen tugas untuk memandu jadwal mereka secara visual dan interaktif.',
      'Manfaatkan insentif berupa penghargaan non-materi seperti plakat, sertifikat, atau pengumuman "Employee of the Month".'
    ],
    communicationStyle: 'Sangat hangat, ekspresif secara verbal maupun non-verbal, antusias, suportif, dan senantiasa membangun keakraban.',
    idealEnvironment: 'Humas, pemasaran strategis, penjualan relasional, pelatihan SDM berkesinambungan, dan tim kolaborasi kreatif yang bebas ide.',
    hrManagementGuide: [
      'Manfaatkan kapasitas ekstrovert mereka semaksimal mungkin untuk keperluan branding, negosiasi lobi, dan pembentukan budaya perusahaan (culture champion).',
      'Bantu mereka membangun disiplin pribadi dalam hal detail, pengelolaan waktu, dan penyelesaian tugas akhir (follow-through).',
      'Berikan pengakuan dan apresiasi sosial secara berkala agar tangki motivasi intrinsik mereka selalu terisi penuh.'
    ]
  },
  IS: {
    typeCode: 'IS',
    typeName: 'Influence-Steadiness (The Advisor / Harmonizer)',
    generalDescription: 'Individu dengan profil gabungan Influence-Steadiness (IS) mewujudkan perpaduan antara keramahan yang hangat (I) dengan kesabaran, loyalitas, dan ketenangan emosional (S). Mereka adalah sosok yang amat suportif, penuh kasih sayang, dan memprioritaskan kesejahteraan, keamanan, serta keharmonisan psikologis setiap anggota tim di atas pencapaian target ambisius. Profil IS bertindak sebagai pendengar yang ulung, mediator damai (peacemaker), dan perekat hubungan kerja jangka panjang yang dilandasi rasa saling percaya yang mendalam. Mereka cenderung menghindari sorotan publik yang agresif atau konflik terbuka, memilih peran sebagai penasihat di belakang layar (advisor) yang memastikan semua orang merasa dihargai dan didengarkan dengan tulus.',
    rolesNarrative: 'Kandidat sangat tepat dan akan menampilkan performa paling otentik jika ditempatkan pada posisi yang menekankan pada pelayanan manusiawi, empati tinggi, dan resolusi interpersonal secara sabar. Proyeksi posisi profesi yang paling cocok meliputi Konseling SDM (HR Counseling), Pelayanan Pelanggan (Customer Service) penanganan komplain tingkat lanjut, Fasilitator Komunitas Karyawan, Guru/Pengajar Perusahaan, atau peran administrasi pendukung operasional. Di industri kesehatan, pendidikan, layanan sosial, maupun hospitalitas, mereka merupakan tulang punggung kepuasan pelanggan. Mereka kurang disarankan untuk memimpin divisi penjualan hard-sell yang agresif atau menjadi pengambil keputusan restrukturisasi (PHK massal) karena beban emosionalnya akan terlalu merusak mental mereka.',
    recommendedRoles: [
      'Employee Counselor / HR People Care & Wellness Specialist',
      'Customer Success Specialist / Service Excellence & Retention Manager',
      'Community Coordinator / Internal Facilitator',
      'Administration & Operations Support Lead'
    ],
    strengthsNarrative: 'Kekuatan terbesar mereka bersumber pada kecerdasan emosional dan kapasitas mendengarkan secara aktif (active listening). Mereka sangat mampu meredakan ketegangan konflik perselisihan antar pihak dengan cara yang menenangkan hati, suportif, dan adil. Konsistensi, kesetiaan pada visi organisasi, dan keandalan mereka menjadikannya karyawan yang tak tergantikan dalam menjaga stabilitas moral tim. Kemampuan mereka dalam membangun hubungan (rapport building) bersifat jangka panjang dan sejati, bukan transaksional, sehingga sangat efektif dalam mempertahankan pelanggan kunci (client retention) atau memelihara loyalitas staf berbakat di dalam perusahaan.',
    strengths: [
      'Kapasitas empati luar biasa sebagai pendengar aktif yang mampu menenangkan situasi krisis atau perselisihan interpersonal',
      'Kemahiran membangun dan memelihara hubungan kerja jangka panjang yang dilandasi kepercayaan murni',
      'Karakter yang sangat setia, kooperatif, andal, dan menghadirkan aura kedamaian saat bekerja sama',
      'Komitmen kuat untuk mendukung keberhasilan kolektif rekan kerja tanpa motivasi mementingkan diri sendiri'
    ],
    weaknessesNarrative: 'Kelemahan paling krusial kandidat IS adalah keraguan atau kelambanan mereka saat dihadapkan pada situasi yang menuntut pengambilan keputusan tegas yang berisiko menyinggung perasaan atau memicu ketidaksenangan orang lain. Mereka menderita kecemasan (anxiety) tinggi jika harus terlibat dalam konfrontasi langsung atau menegakkan disiplin keras terhadap bawahan. Akibatnya, mereka sering menoleransi perilaku buruk atau kinerja rendah dari anggota tim demi menghindari konflik. Selain itu, kecepatan respon mereka dapat melambat signifikan apabila dituntut mengambil keputusan strategis berisiko tinggi dalam tempo singkat, karena mereka selalu berusaha mencari persetujuan mutlak (consensus) dari semua pihak yang terlibat.',
    weaknesses: [
      'Kelumpuhan dalam mengambil keputusan (decision paralysis) jika ada potensi memicu konflik atau melukai perasaan pihak lain',
      'Cenderung selalu menghindari konfrontasi langsung secara pasif, bahkan ketika penegakan disiplin mutlak diperlukan',
      'Proses adaptasi sangat lamban dalam menghadapi perubahan kebijakan mendadak atau keputusan berisiko tinggi tanpa preseden'
    ],
    conflictsNarrative: 'Potensi konflik yang membahayakan stabilitas mental kandidat terjadi apabila mereka terperangkap di tengah-tengah lingkungan kerja yang berbudaya toxic, kompetisi saling menjatuhkan antar tim yang tidak sehat (cut-throat competition), atau perselisihan terbuka antara atasan yang saling bersaing. Dalam tekanan agresi seperti itu, kandidat IS cenderung merasa sangat tertekan secara batin dan memilih menarik diri dari dinamika tim secara diam-diam (silent withdrawal), yang pada akhirnya dapat berujung pada burnout emosional. Solusi utama untuk ini adalah menyediakan kanal pelaporan yang aman bagi mereka, serta peran atasan untuk turun tangan memediasi konflik yang terlalu keras agar tidak membebani kapasitas batin kandidat IS secara langsung.',
    potentialConflicts: [
      {
        trigger: 'Eskalasi konflik terbuka secara verbal di antara rekan kerja atau tekanan persaingan internal yang manipulatif.',
        impact: 'Kandidat akan menarik diri (withdraw), mengalami tekanan batin berat, hingga penurunan drastis pada inisiatif inisiatif.',
        solution: 'Manajer harus melakukan intervensi perlindungan, memediasi secara rasional, dan memberi dukungan moral privat (reassurance) kepada kandidat.'
      }
    ],
    treatmentsNarrative: 'Pendekatan manajerial dan HR terbaik bagi kandidat ini adalah dengan memberikan dorongan rasa aman psikologis (psychological safety) secara konsisten. Atasan harus sering-sering mengekspresikan apresiasi verbal atas keharmonisan, kontribusi tak kasat mata, dan dedikasi stabil yang telah mereka bangun. Untuk mengatasi kelemahan mereka, HR perlu menyusun program bimbingan asertivitas (assertiveness training) secara bertahap (step-by-step), mengajarkan teknik penyampaian argumen tegas secara sopan (polite firmness). Saat ada perubahan sistem atau restrukturisasi organisasi, sampaikan kepada kandidat IS jauh-jauh hari secara personal dengan penjelasan mendalam mengenai alasan mengapa perubahan tersebut pada akhirnya akan "membantu dan menyelamatkan semua orang".',
    bestTreatments: [
      'Berikan jaminan keamanan emosional, apresiasi tulus atas sikap kooperatif, dan nilai kontribusi stabilitas mereka.',
      'Bimbing dan latih kandidat secara perlahan dan sistematis dalam membangun keberanian asertif untuk mengatakan "tidak".',
      'Implementasikan perubahan operasional secara bertahap dan libatkan mereka dalam diskusi penyesuaian proses tim.'
    ],
    communicationStyle: 'Sangat ramah, lembut, sabar, suportif, penuh empati (empathic), mendengarkan dengan penuh perhatian, dan tidak konfrontatif.',
    idealEnvironment: 'Departemen layanan pelanggan terpadu, konseling/HR, manajemen komunitas, pembinaan budaya perusahaan, dan tim kerja kooperatif stabil.',
    hrManagementGuide: [
      'Prioritaskan penempatan mereka pada posisi krusial yang membutuhkan perbaikan hubungan interpersonal, negosiasi damai, dan pembinaan moral.',
      'Sediakan mentoring berkelanjutan untuk membantu membangun ketebalan mental (resilience) saat harus mengambil keputusan personalia yang keras.',
      'Berikan rasa aman, validasi atas kerja keras loyalitas mereka, dan ciptakan iklim keterbukaan yang tidak menghakimi.'
    ]
  },
  IC: {
    typeCode: 'IC',
    typeName: 'Influence-Compliance (The Assessor / Strategist)',
    generalDescription: 'Individu dengan profil kepribadian Influence-Compliance (IC) dianugerahi kemampuan unik dan paradoksal dalam memadukan daya pikat komunikasi publik (I) dengan kedalaman analisis data kognitif dan kepatuhan struktural (C). Mereka adalah jembatan intelektual sejati; memiliki kecakapan istimewa untuk mengurai, menganalisis, dan membedah informasi teknis/statistik yang sangat rumit, kemudian merakitnya kembali ke dalam sajian narasi presentasi atau komunikasi massa yang sangat menarik, rapi, memikat, dan mudah dicerna oleh audiens awam. Pemikiran mereka sangat strategis karena kreativitas imajinatif mereka selalu dipandu dan dibatasi oleh parameter fakta, validitas metodologi riset, serta kepatuhan terhadap regulasi yang berlaku.',
    rolesNarrative: 'Kandidat IC diproyeksikan meraih sukses luar biasa dan berdampak besar dalam posisi-posisi krusial seperti Product Management, Business Strategy Analysis, Riset Pemasaran Digital Lanjutan, Desain Pembelajaran Korporat (Instructional Design), serta Komunikasi Korporat Berbasis Data (Investor Relations). Di perusahaan berbasis teknologi, sains, farmasi, atau finansial konsultan, posisi mereka sangat vital sebagai penghubung (translator) antara insinyur teknis/programmer yang kaku dengan dewan direksi atau klien yang berorientasi bisnis kasual. Mereka tidak cocok di bagian eksekusi teknis murni yang serba tertutup (tanpa audiens) ataupun sales jalanan yang mengutamakan intuisi tanpa landasan data konkret.',
    recommendedRoles: [
      'Senior Product Manager / Strategist Business Analyst',
      'Market Research & Insight Director / Investor Relations Lead',
      'Instructional Designer / Corporate Learning & Development Manager',
      'Digital Marketing Strategist / Data Visualization Expert'
    ],
    strengthsNarrative: 'Kekuatan puncak (core strength) kandidat ini adalah sinergi antara kreativitas visual-verbal dan akurasi riset objektif. Mereka sanggup mengemas, menyederhanakan, dan mempresentasikan arsitektur data teknis yang kompleks sedemikian rupa sehingga memukau klien tingkat atas atau stakeholder awam. Inovasi yang mereka ajukan hampir selalu berhasil diimplementasikan secara legal dan logis karena proses berpikir mereka telah memperhitungkan regulasi valid dan batasan sistem (calculated creativity). Selain itu, mereka sangat cermat dalam membaca, menganalisis pola perilaku, dan memprediksi respons pasar atau sentimen audiens berdasarkan metodologi pengumpulan fakta kuantitatif dan kualitatif secara berimbang.',
    strengths: [
      'Kapasitas intelektual tinggi dalam menyederhanakan dan menjelaskan konsep teknis rumit ke dalam bahasa bisnis awam yang persuasif',
      'Produktivitas inovasi kreatif yang senantiasa dilandaskan dan divalidasi oleh analisis data rasional serta regulasi ketat',
      'Sangat cermat, peka, dan analitis dalam mengamati sentimen audiens, riset kompetitor, dan tren pasar makro',
      'Pembuatan desain presentasi, dokumen pitching, atau laporan operasional yang sangat komprehensif, estetis, sekaligus akurat'
    ],
    weaknessesNarrative: 'Kelemahan batiniah dari kandidat IC bermuara pada tarikan konflik internal antara dorongan dinamis untuk bertindak gesit dan spontan (pengaruh I) melawan dorongan perfeksionis untuk terus mengecek dan menganalisis setiap variabel agar tanpa cela (pengaruh C). Hal ini kerap memicu kebimbangan paralisis eksekusi (paralysis of execution). Selain itu, kombinasi ego pengakuan sosial (I) dan ego standar intelektual tinggi (C) menjadikan mereka sangat sensitif, emosional, atau defensif apabila hasil karya analisis, desain, atau argumentasi presentasinya dikritik tajam secara terbuka, atau jika integritas data mereka diragukan di depan publik (inferiority complex trigger).',
    weaknesses: [
      'Rentang kebingungan dan stres akibat tarik-menarik batin antara tuntutan bertindak cepat (I) versus kehati-hatian analisis presisi (C)',
      'Hipersensitif, rentan tersinggung, atau menjadi sangat defensif (ngotot) terhadap kritik atas hasil presentasi atau kualitas karyanya',
      'Kecenderungan menunda finalisasi (prokrastinasi) suatu project karena merasa desain komunikasi atau analisis datanya belum mencapai tingkat kesempurnaan mutlak'
    ],
    conflictsNarrative: 'Konflik profesional paling merusak akan timbul seketika apabila ide, karya, atau analisis data komprehensif yang telah dipersiapkan kandidat IC diremehkan, dipotong, atau diragukan secara terbuka oleh manajemen tanpa memberi mereka ruang untuk berdiskusi rasional mempertahankan tesisnya. Insiden ini akan melukai kebanggaan intelektual mereka, berdampak pada penarikan komitmen total. Solusi manajerial terbaik adalah selalu menyampaikan koreksi, revisi, atau penolakan ide secara empatik di ruang privat, serta pastikan Anda memberikan sanggahan menggunakan argumen balik yang objektif, bukan pendapat subjektif belaka. Hormati upaya analisis dan waktu perancangan mereka sebelum meminta revisi.',
    potentialConflicts: [
      {
        trigger: 'Kritik tajam, peremehan, atau pembatalan ide di ruang publik yang meragukan kredibilitas data maupun daya tarik karya visualnya.',
        impact: 'Kandidat akan merasa sangat terhina (tersinggung), bertahan secara emosional-argumentatif, dan memendam ketidakpuasan mendalam (dendam profesional).',
        solution: 'Sampaikan koreksi manajerial di sesi empat-mata (privat), berikan apresiasi pendahuluan, lalu diskusikan penyesuaian berbasis logika yang saling menguntungkan.'
      }
    ],
    treatmentsNarrative: 'Treatment manajerial terbaik untuk memaksimalkan potensi hibrida kandidat ini adalah dengan secara resmi menugaskan mereka sebagai perwakilan perusahaan (spokesperson), konsultan internal, atau jembatan komunikasi sentral antara divisi operasional teknis/IT dengan divisi komersial/Manajemen Eksekutif. Selalu apresiasi secara eksplisit kombinasi unik antara estetika hasil karya presentasi (visual kreatif) dengan kekuatan analisis kedalaman data mereka. Jika prioritas proyek bergeser, HR dan Atasan harus memberikan arahan panduan strategis yang rasional (kenapa harus berubah) agar mereka tidak merasa usahanya membuang waktu. Sediakan infrastruktur teknologi perangkat lunak analitik atau desain terbaik untuk mendukung produktivitas mereka.',
    bestTreatments: [
      'Secara resmi fasilitasi peran strategis mereka sebagai penerjemah (bridge) antara wilayah teknikal murni dan wilayah komersial pengguna.',
      'Berikan apresiasi pengakuan (recognition) ganda: puji kreativitas ide komunikasinya, dan hormati keakuratan logika data di baliknya.',
      'Bantu mereka menetapkan batas "good enough" untuk merilis laporan/produk demi mencegah penundaan akibat sindrom kesempurnaan tak terhingga.'
    ],
    communicationStyle: 'Sangat artikulatif, tertata rapi, terstruktur mendalam, berbasis landasan logika, namun senantiasa dibalut dengan diksi persuasif dan presentasi estetis.',
    idealEnvironment: 'Konsultasi pengembangan bisnis, arsitektur produk komersial, penyusunan strategi komunikasi korporat (corporate branding/PR data-driven), dan riset analisis investasi (investment analyst).',
    hrManagementGuide: [
      'Gunakan mereka sebagai "tangan kanan" manajemen dalam merumuskan kebijakan rumit menjadi SOP/materi panduan yang mudah diadopsi oleh seluruh jajaran staf.',
      'Sediakan panduan alokasi prioritas waktu (timeboxing) yang jelas saat mereka sedang mengeksekusi analisis besar, agar tenggat peluncuran terjaga.',
      'Seringlah menantang mereka dengan studi kasus simulasi (problem-solving case) lintas departemen yang merangsang kemampuan analitis sekaligus kreativitas solusi mereka.'
    ]
  },
  S: {
    typeCode: 'S',
    typeName: 'Steadiness (The Specialist / Support Specialist)',
    generalDescription: 'Tipe kepribadian Steadiness (S) secara mendalam merepresentasikan pondasi stabilitas, kesabaran tanpa batas, keteraturan, dan loyalitas dedikasi dalam sebuah ekosistem organisasi. Mereka adalah pekerja spesialis yang tenang dan memiliki tingkat ketahanan mental (endurance) serta konsentrasi yang luar biasa tinggi untuk mengeksekusi serangkaian tugas-tugas berulang, runut, dan terprediksi tanpa merasa jenuh. Individu dengan tipe S murni amat sangat menghargai status quo, kepastian alur ritme kerja harian, keharmonisan iklim tim tanpa intrik politik kantor, serta gaya kepemimpinan yang mengayomi (paternal/maternal). Motivasi utama mereka bukanlah pencapaian ambisius kompetitif atau popularitas (seperti D atau I), melainkan penciptaan lingkungan yang damai, aman secara jangka panjang, dan berkontribusi membaktikan diri mendukung keberhasilan atasan maupun tim.',
    rolesNarrative: 'Berdasarkan karakteristik keandalan dan kesabaran repetitifnya, kandidat S diproyeksikan mencapai level kinerja emas pada kelompok posisi esensial pendukung seperti Administrasi Operasional Terpadu (Back-office Master), Supervisor Pengolahan Data Entri (Data Processing Lead), Dukungan Teknis Rutin (Helpdesk L1/L2), Manajer Pelayanan Pelanggan Pasif (Customer Support Retention), dan Logistik Rantai Pasok (Supply Chain Administration). Di institusi keuangan, manufaktur, perbankan, atau instansi publik, mereka adalah pahlawan tanpa tanda jasa (unsung heroes) yang memastikan mesin perusahaan terus berputar presisi setiap harinya. Mereka sangat tidak cocok dipaksakan ke posisi penjualan lapangan (door-to-door sales) yang sarat penolakan, atau posisi manajer pemadam krisis (crisis turn-around manager) yang serba kacau dan mendadak.',
    recommendedRoles: [
      'Senior Operational Administrator / Master Data Entry Supervisor',
      'Customer Service Representative / IT Helpdesk Support Lead',
      'Supply Chain & Warehouse Operations Administrator',
      'Spesialis Pemeliharaan Teknis Berulang / General Operations Support'
    ],
    strengthsNarrative: 'Kekuatan terbesar kandidat bersumber dari konsistensi tingkat dewa dalam pengerjaan tugas tanpa penurunan kualitas, sekalipun pekerjaan tersebut bersifat monoton dan berulang selama bertahun-tahun (high tolerance for repetitive routine). Tingkat kesabaran emosional mereka sangat superior dalam menghadapi rutinitas membosankan atau nasabah/klien yang lamban merespons. Loyalitas mereka terhadap instansi, atasan langsung, dan nilai kekeluargaan tim adalah yang tertinggi di antara semua tipe. Mereka secara konsisten menunjukkan karakter andal (reliable), sangat siap dimintai bantuan, dan merupakan "pendengar aman" bagi keluh-kesah rekan kerjanya. Kemampuan mereka menciptakan irama kerja yang stabil mencegah terjadinya krisis operasional akibat kecerobohan.',
    strengths: [
      'Konsistensi, ketahanan, dan kesabaran tingkat tinggi untuk mendedikasikan diri pada rutinitas operasional berkualitas jangka panjang',
      'Anggota tim dengan profil loyalitas tertinggi, tidak mudah pindah kerja (low turnover risk), dan senantiasa siap menjadi support sistem',
      'Mampu mempertahankan konsentrasi kerja dalam kondisi monoton yang menuntut ketahanan fokus penyelesaian detail',
      'Pembawaan yang sangat menenangkan, dapat dipercaya, dan tulus dalam memberikan layanan terbaik bagi nasabah/klien internal'
    ],
    weaknessesNarrative: 'Kelemahan paling fundamental dari kandidat S adalah tingkat resistensi, kecemasan, dan kebingungan yang akut terhadap perubahan mendadak (sudden unannounced changes). Apabila metode kerja, perangkat lunak (software), struktur tim, atau pimpinan departemen diganti secara drastis tanpa masa transisi, performa dan mentalitas kerja mereka akan anjlok (paralysis by change). Kelemahan lainnya adalah sikap pasif dalam menyuarakan inisiatif terobosan secara spontan, karena rasa segan (sungkan) untuk mengganggu tatanan yang sudah mapan. Sifat terlalu penurut mereka (people-pleaser) membuat mereka amat sulit berkata "tidak" pada tambahan beban kerja lembur dari atasan/rekan, yang diam-diam berakumulasi menjadi kelelahan ekstrem (burnout).',
    weaknesses: [
      'Kecenderungan resisten (menolak) secara pasif atau membutuhkan waktu transisi sangat lama untuk beradaptasi pada perubahan mendadak',
      'Sangat sulit menolak permintaan lembur atau melimpahkan tugas dari orang lain (enggan bersikap tegas/asertif mengatakan "tidak")',
      'Cenderung memendam ide inovatif atau keluhan pribadi, dan kurang berani menyuarakan inisiatif perbaikan secara spontan (pasif)'
    ],
    conflictsNarrative: 'Titik puncak konflik dan hancurnya motivasi tipe S terjadi ketika manajemen memberlakukan transformasi sistem menyeluruh atau merombak alur kerja operasional secara mendadak tanpa pembekalan informasi, jaminan keamanan, atau pendampingan yang mumpuni. Perlakuan atasan yang otoriter, kasar, atau terus mendesak dengan tenggat waktu kepanikan yang berubah-ubah (fire-fighting culture) akan menimbulkan kengerian psikologis bagi kandidat. Solusi absolut untuk mengelola hal ini adalah: HR atau Manajer wajib mensosialisasikan setiap wacana perubahan operasional jauh sebelum hari-H peluncuran (early warning notification). Berikan penjelasan mengapa masa depan pasca-perubahan akan tetap "aman" (safe), serta sediakan pelatihan pendampingan (hand-holding training) secara bertahap (step-by-step).',
    potentialConflicts: [
      {
        trigger: 'Reorganisasi, perombakan sistem software, atau instruksi kerja harian yang berubah mendadak dari jam ke jam tanpa pemberitahuan.',
        impact: 'Kandidat akan mengalami kelumpuhan (paralysis) fungsional, stres kecemasan tinggi, dan penurunan akurasi fatal akibat kepanikan mendalam.',
        solution: 'Sampaikan wacana perubahan berbulan/berminggu sebelumnya, jelaskan alasan secara rinci, dan berikan jaminan keamanan serta pelatihan perlahan.'
      }
    ],
    treatmentsNarrative: 'Treatment dan perlakuan manajerial terbaik (best management practice) bagi kandidat ini adalah dengan menciptakan lingkungan dan memberikan instruksi kerja yang setransparan, sejelas, dan sestabil mungkin. Atasan wajib membangun hubungan kekeluargaan yang menonjolkan sentuhan empati dan kehangatan personal; tipe S sering mengabdi bukan demi uang (bonus), melainkan karena mereka "peduli" pada kebaikan atasannya. Jangan pernah mengejutkan mereka dengan tenggat akhir kemarin (yesterday-deadline). Sebaliknya, fasilitasi mereka dengan jadwal ritme kalender yang stabil. HR perlu merancang program "check-in batin" (one-on-one coaching), di mana atasan secara aktif memancing (probing) dan memberi ruang aman agar kandidat S berani menyuarakan beban pikiran, usulan, atau ketidakmampuannya menerima ekstra beban.',
    bestTreatments: [
      'Tunjukkan perhatian tulus, kehangatan empati, serta hargai kontribusi stabilitas kerjanya dalam setiap instruksi (membangun ikatan kekeluargaan).',
      'Hindari memberikan delegasi beban kepanikan tenggat waktu mendadak yang menuntut kecepatan tanpa persiapan.',
      'Sediakan masa transisi adaptasi dan pelatihan perlahan setiap kali ada pemutakhiran sistem operasi perusahaan.'
    ],
    communicationStyle: 'Tenang, lembut, mendengarkan secara pasif-aktif, sangat bersopan-santun, kooperatif penuh, dan mencintai alur instruksi teratur.',
    idealEnvironment: 'Departemen operasional mesin rutin perusahaan, administrasi berulang, dukungan pemeliharaan sistem terpadu, dan peran layanan kesetiaan stabil jangka panjang.',
    hrManagementGuide: [
      'Selalu sosialisasikan perubahan strategis secara inkremental (bertahap) disertai narasi jaminan keamanan (konteks yang jelas) pada kandidat.',
      'Bantu melindungi keseimbangan kehidupan-kerja (work-life balance) mereka dengan mencegah atasan atau departemen lain "mengeksploitasi" sifat penurut mereka.',
      'Rancang sesi mentoring yang mendorong mereka (empowerment) untuk perlahan belajar menjadi lebih asertif dan berani memimpin proyek inisiatif skala kecil.'
    ]
  },
  SC: {
    typeCode: 'SC',
    typeName: 'Steadiness-Compliance (The Peacemaker / Systematic Operator)',
    generalDescription: 'Individu dengan profil Steadiness-Compliance (SC) merupakan representasi sempurna dari tenaga operasional yang metodis, luar biasa cermat, stabil, dan sangat disiplin secara absolut dalam mematuhi serta merawat integritas Prosedur Operasional Standar (SOP). Mereka mengombinasikan kesabaran tanpa akhir (S) dengan standar analisis presisi tinggi (C). Mentalitas dasar pekerja ini mengutamakan kepastian hukum operasional (compliance), keteraturan tatanan arsip/berkas, serta keandalan pemeliharaan sistem agar berjalan tanpa ada satu pun cacat (flawless execution). Mereka bekerja dengan ritme mantap, diam, berhati-hati, dan sangat tidak menyukai pendekatan coba-coba (trial and error). Bagi tipe SC, "melakukan segala sesuatu dengan benar pada percobaan pertama" (do it right the first time) adalah mantra kehidupan profesionalnya.',
    rolesNarrative: 'Kandidat diproyeksikan akan menorehkan prestasi gemilang dan karier panjang di bidang-bidang yang mengharamkan toleransi kesalahan klerikal (zero error tolerance). Profesi Akuntansi (Accounting & Bookkeeping), Pengendalian Dokumen Eksekutif (Document Controller), Spesialis Arsip Database (Data Custodian), Pengawasan Mutu (Quality Control Inspector) tingkat operasional berkelanjutan, dan Administrasi Penggajian Kompleks (Payroll & Benefits) adalah wilayah takluk mereka. Di institusi perbankan, peradilan, konstruksi berat, atau manufaktur alat kesehatan, peran tipe SC menjadi jangkar pengaman dari risiko denda hukum (legal liability) akibat kesalahan pendataan dokumen operasional. Mereka kurang pas jika diposisikan sebagai inovator produk perintis (R&D radikal) atau pemasar visi besar karena keengganan berhadapan dengan risiko ambiguitas.',
    recommendedRoles: [
      'Senior Accounting & Finance Compliance Officer',
      'Quality Control Process Inspector / Master Document Controller',
      'Database Operations Administrator / Legal Archive Specialist',
      'Payroll, Compensation & Benefits Administrator'
    ],
    strengthsNarrative: 'Kekuatan terbesar kandidat ini adalah penguasaan tingkat pakar pada tingkat ketelitian mikroskopis yang mampu mendeteksi kesalahan (anomali) data yang terlewat oleh orang lain. Dedikasi ketekunan mereka dalam menjalankan dan memverifikasi tahapan SOP dari awal hingga akhir dalam rentang waktu yang sangat panjang (years of consistency) menjadikan mereka penjaga gawang stabilitas mutu perusahaan. Keterandalan dalam memilah, menata, dan mengamankan dokumentasi krusial memastikan sistem administrasi organisasi tertata tanpa cela. Sifat mereka yang sangat berhati-hati memastikan bahwa setiap keputusan atau langkah teknis yang mereka ambil telah didasari perhitungan keamanan risiko yang sangat matang (risk averse approach).',
    strengths: [
      'Disiplin tingkat absolut dalam mengikuti, menghormati, dan merawat panduan Standar Operasional Prosedur (SOP)',
      'Akurasi kalkulasi atau pembacaan data, kecermatan mikroskopis, dan minim risiko kesalahan klerikal ekstrem',
      'Dapat diandalkan penuh untuk penyelesaian tugas presisi tinggi berulang yang menuntut konsentrasi sepi',
      'Pola kerja yang sangat sistematis, teratur rapi (well-organized), dan menjamin kerapian dokumentasi audit compliance'
    ],
    weaknessesNarrative: 'Kelemahan paling kronis kandidat SC bermuara pada sikap serba sangat berhati-hati (over-cautious) yang kelewat batas, sedemikian rupa sehingga mereka menjadi luar biasa lambat (slow-paced) dalam mengeksekusi tindakan atau mengambil keputusan mandiri manakala berhadapan dengan situasi krisis ambigu yang prosedurnya belum tertulis di buku manual. Mereka sering menderita kecemasan (anxiety loop) apabila atasan memberikan arahan yang bersifat umum, konsep abstrak (high-level), atau kurang rinci, karena takut disalahkan atas kesalahan interpretasi (fear of making mistakes). Mereka akan terus-menerus meminta persetujuan berlapis (approval loops) dari atasan sebelum berani menggeser pulpen, sehingga berisiko menghambat kelancaran proses bisnis (bottleneck) dalam skenario situasi mendesak.',
    weaknesses: [
      'Kecenderungan untuk menjadi terlalu berhati-hati (over-cautious) secara berlebihan, memicu kelambanan fatal dalam mengambil inisiatif keputusan mandiri darurat',
      'Sangat rentan terserang kepanikan atau kecemasan ekstrem (paralysis) apabila instruksi kerja kurang rinci, samar-samar (ambiguous), atau di luar SOP tertulis',
      'Keengganan akut mengambil keputusan terkecil sekalipun tanpa jaminan persetujuan (approval) protektif atau otorisasi berlapis dari atasan langsung'
    ],
    conflictsNarrative: 'Potensi konflik yang merusak secara diam-diam (silent conflict) akan langsung meledak (internalize) di dalam diri kandidat SC apabila atasan atau manajemen menuntut mereka untuk "berimprovisasi", memberikan arahan tugas berupa target samar-samar (misal: "pokoknya bereskan cepat"), atau mengubah-ubah parameter kerja setiap jam tanpa adanya ketetapan standar prosedur baku yang dapat dijadikan tameng perlindungan. Situasi kacau (chaos) ini akan memicu kandidat melakukan penundaan eksekusi tanpa batas waktu (procrastination by freezing) sebagai mekanisme pertahanan. Solusi esensial adalah senantiasa menyediakan format acuan (template) terstandarisasi, serta membuat batasan toleransi kesalahan yang dapat diampuni (acceptable error margin) agar mereka berani melangkah walau prosedurnya belum 100% sempurna.',
    potentialConflicts: [
      {
        trigger: 'Tuntutan penyelesaian target dengan instruksi samar-samar (ambigu), paksaan berimprovisasi mendadak, atau absennya petunjuk teknis.',
        impact: 'Kandidat akan membeku (freeze), menunda eksekusi sampai ada perintah tertulis rinci, dan mengalami stres kepanikan akut karena takut disalahkan.',
        solution: 'Sediakan selalu format acuan dokumen kerja tertulis (guidelines), contoh preseden, dan pastikan perlindungan tanggung jawab (backing) dari atasan langsung.'
      }
    ],
    treatmentsNarrative: 'Treatment manajerial terbaik adalah memenuhi kebutuhan fundamental mereka terhadap keteraturan, kepastian langkah kerja, dan jaminan keamanan struktural. Atasan wajib menyediakan petunjuk teknis implementasi tertulis (manual guide) yang sangat terperinci (step-by-step detail). Selalu berikan apresiasi tinggi bukan hanya pada kecepatan kerja, tetapi spesifik puji pada "ketelitian, kesempurnaan dokumen, dan konsistensi penjagaan kualitas (SOP)"-nya. Untuk mengembangkan potensi mereka, HR harus memberikan dukungan bimbingan mentor (coaching) guna membangun rasa percaya diri mereka dalam mengeksekusi diskresi mandiri pada kasus-kasus skala minor, sehingga tidak seluruh keputusan teknis kecil-kecilan harus tertunda menunggu ketersediaan direksi.',
    bestTreatments: [
      'Seringlah memuji (apresiasi eksplisit) pada keandalan sistem dokumentasinya, ketelitian bebas-kesalahan, serta integritas konsistensi kepatuhannya.',
      'Bantu membangun rasa percaya diri profesional secara perlahan melalui pemberian mandat otoritas keputusan mandiri pada cakupan-cakupan tugas berskala kecil secara bertahap.',
      'Susun arahan delegasi kerja dan tenggat waktu secara sangat terstruktur, tertulis rapi, kronologis, dan terprediksi, menghindari manajemen perintah lisan mendadak.'
    ],
    communicationStyle: 'Sangat rapi, penuh tata krama sopan, berlandaskan rentetan fakta pendukung, sistematis metodis, serta terstruktur cermat (tidak berbunga-bunga/casual).',
    idealEnvironment: 'Pusat pengolahan akurasi data besar, departemen akuntansi/pajak kepatuhan ketat, biro penyusunan tata SOP, laboratorium jaminan mutu, dan administrasi kontrol inventaris.',
    hrManagementGuide: [
      'Sediakan deskripsi pekerjaan (Job Description) detail, petunjuk teknis baku, serta batas kewenangan yang jelas dan tertulis rapi untuk menghapus area abu-abu fungsional.',
      'Sediakan program pemberdayaan (empowerment training) khusus untuk memandu transisi mereka berani mengambil diskresi dan keputusan mandiri cepat saat menghadapi anomali kecil.',
      'Pantang melakukan perubahan kerangka operasional (software/alur koordinasi) secara mendadak; berlakukan masa sosialisasi dan uji coba beriringan secara parsial.'
    ]
  },
  C: {
    typeCode: 'C',
    typeName: 'Compliance (The Thinker / Quality Analyst)',
    generalDescription: 'Tipe kepribadian Compliance (C) sejati (murni) adalah sosok sang penalar logis, arsitek analitis rasional, dan pemikir kritis ekstrem yang kerangka pengambilan keputusannya selalu dan hanya berlandaskan pada pembuktian fakta valid, angka statistik, data komprehensif, serta kepatuhan mutlak pada aturan keilmuan atau regulasi resmi. Individu ini sangat mengedepankan objektivitas, logika dingin, presisi ilmiah, dan akurasi tinggi sebagai barometer kebenaran universal di lingkungan kerjanya. Mereka beroperasi layaknya mesin pemindai (scanner) yang tajam—mampu mengurai permasalahan paling kompleks sekalipun, namun juga secara alami didorong (driven) untuk mencari-cari celah kelemahan, inefisiensi, atau kesalahan dari setiap sistem dan proposisi. Mereka adalah kaum intelektual penyendiri yang memprioritaskan "Kebenaran Hakiki" di atas keharmonisan hubungan sosial kolektif.',
    rolesNarrative: 'Pemetaan proyeksi posisi profesional paling tepat bagi kandidat C adalah posisi puncak spektrum analitik, perancangan sistem logika, atau pengawasan audit forensik tingkat lanjut. Profesi yang sangat ideal meliputi Analisis Keuangan Kompleks (Financial/Investment Analyst), Aktuaria (Actuary) pada asuransi, Pakar Riset dan Pengembangan Ilmiah/Teknik (R&D Scientist), Arsitektur Database (Data Science), Pengujian Kualitas Perangkat Lunak Lanjutan (Senior Software QA), hingga Penyusunan Naskah Draft Dokumen Hukum Korporat (Legal Drafter/Contract Specialist). Keahlian mereka sangat krusial di instansi perbankan mitigasi risiko tinggi, lembaga riset farmasi/medis, manufaktur rekayasa (engineering), dan biro keamanan siber. Mereka terlarang menempati posisi Sales & Marketing yang mengharuskan kelihaian berbicara manipulatif dan keputusan berbasis insting (gut-feeling) kosong.',
    recommendedRoles: [
      'Senior Financial Analyst / Chief Actuary / Lead Forensic Auditor',
      'Advanced Software Tester (QA Engineer) / Head of Compliance Risk Analyst',
      'Research & Development Data Scientist / System Architecture Engineer',
      'Corporate Legal Draft Specialist / Policy Formulation Analyst'
    ],
    strengthsNarrative: 'Kelebihan utama (superpower) kandidat C yang tidak tertandingi oleh tipe lain adalah daya tembus analisis kognitif yang tajam (laser-focused intellect) dalam mengurai masalah makro menjadi komponen variabel-variabel mikro kompleks yang dapat dihitung (quantifiable). Sikap mereka yang murni objektif dan independen memastikan bahwa setiap perumusan kesimpulan terbebas sepenuhnya dari prasangka emosional (bias emosional) atau tekanan ego kelompok. Selain itu, kekuatan standar profesional (quality orientation) dan integritas intelektual yang sangat tinggi (hyper-vigilance) menjadikan mereka auditor forensik atau perancang prosedur yang luar biasa teliti; mereka mampu mengidentifikasi serta memitigasi potensi kelemahan (loopholes/risks) fatal suatu rencana bertahun-tahun sebelum risiko tersebut menjadi masalah mematikan di lapangan produksi.',
    strengths: [
      'Kedalaman kemampuan analisis intelektual yang luar biasa (high-level deductive thinking) untuk membedah serta mensintesis permasalahan kompleks melalui logika murni objektif',
      'Tingkat ketelitian (meticulousness) ekstrem bagaikan radar sensitif dalam mendeteksi anomali kesalahan, kecacatan logika teknis, atau celah risiko celaka tersembunyi',
      'Memegang teguh komitmen paripurna pada kualitas pengerjaan dan standar regulasi profesional; pantang menyetujui hasil setengah jadi (zero compromise on quality)'
    ],
    weaknessesNarrative: 'Namun demikian, kelemahan kandidat C bagaikan pedang bermata dua; bahaya laten terbesar adalah mereka rentan lumpuh terjebak dalam kondisi "Analysis Paralysis". Hasrat perfeksionis yang obsesif untuk mengecek silang (cross-check) data dari seluruh kemungkinan skenario secara berlebihan menyebabkan mereka menunda pengambilan keputusan krusial atau penyelesaian proyek peluncuran komersial hingga batas waktu berlalu sia-sia. Sikap sangat kaku pada aturan hukum baku atau prosedur teoretis membuat mereka tidak mampu beradaptasi melihat konteks fleksibilitas pragmatis bisnis dunia nyata. Selain itu, mereka memiliki ego akademis/teknis yang besar, membuat mereka menjadi penyendiri (introvert tertutup) dan sangat gelisah (defensive/cemas) tatkala kredibilitas metode atau detail hasil kerjanya mendapat kritikan tajam.',
    weaknesses: [
      'Sangat berisiko fatal terjerembab pada kondisi kronis "Analysis Paralysis" (menganalisis setiap variabel secara hiper-detail tanpa ujung hingga membekukan pengambilan keputusan eksekusi bisnis)',
      'Perilaku yang sering kali sangat kaku (rigid), konservatif pada teori atau aturan tertulis tanpa sedikit pun menenggang pertimbangan konteks urgensi pragmatis fleksibilitas nyata (zero common sense flexibility)',
      'Kecenderungan bersifat sangat tertutup, menghindari sosialisasi tim berlebih, sensitif terhadap kritik metode analitisnya, dan sulit menerima pandangan orang lain yang dianggap "tidak masuk akal logis"'
    ],
    conflictsNarrative: 'Puncak dari konflik operasional yang dapat merusak kinerja tipe C akan segera terpicu secara keras apabila manajemen/atasan mendesak (force) mereka untuk merumuskan persetujuan keputusan final dalam waktu sempit, atau mendesak penandatanganan hasil peluncuran produk tanpa melengkapi mereka dengan data riset pembuktian komprehensif, metodologi pengujian (testing) yang valid, maupun kepastian legal. Apabila ditekan dengan sentimen "intuisi (gut-feeling)" dan "buru-buru (rush)", kandidat akan merespons secara reaksioner: membangkang menolak perintah proses, bersikap argumentatif dingin secara tertulis dengan membeberkan segudang kelemahan rencana, dan memunculkan kebencian terhadap manajemen. Solusi penanganannya adalah memfasilitasi mereka secara intelektual: berikan data dukungan selengkapnya, bicarakan probabilitas risiko objektif (tolerable failure rates), dan patuhi rentang waktu verifikasi standar minimum.',
    potentialConflicts: [
      {
        trigger: 'Pemaksaan desakan batas waktu penyelesaian yang tidak masuk akal atau tuntutan mengambil keputusan strategis bisnis besar tanpa disokong oleh data pembukti pembukuan (feasibility) yang utuh terverifikasi.',
        impact: 'Kandidat akan bersikap membangkang (defensif), melontarkan perlawanan argumen kritis sarkastik dingin secara tertulis (email), dan bersikeras menunda proses atau menolak menandatangani tanggung jawab validasi.',
        solution: 'Bantu kandidat dengan menyajikan data pendahuluan, sampaikan diskusi rasional kalkulasi risiko terbatas (Risk-Benefit trade-off), dan fasilitasi ambang batas kompromi toleransi penyimpangan yang terukur.'
      }
    ],
    treatmentsNarrative: 'Strategi treatment pengelolaan (manajerial eksekutif) tingkat atas yang optimal untuk mengelola kejeniusan teknikal kandidat ini adalah dengan memastikan setiap pembicaraan (briefing/koordinasi) selalu dan konsisten menggunakan bahasa berbasis parameter data murni terukur, angka statistik faktual, objektivitas historis, serta menyediakan waktu durasi riset (RnD sandbox) yang lebih dari cukup (memadai). Hormatilah keunggulan standar presisi tinggi kandidat ini, fasilitasilah ketersediaan ekosistem (environment) kerja yang hening, steril, dan sangat kondusif tenang, yang jauh dari keriuhan distraksi interupsi keramaian hiruk-pikuk aktivitas divisi pemasaran kolektif.',
    bestTreatments: [
      'Dalam menyampaikan pengarahan mandat delegasi, pastikan selalu melampirkan referensi dokumentasi pendukung tertulis faktual komprehensif (SOP teoretis, historis kasus valid, & justifikasi numerik).',
      'Hargai serta validasi standar kualitas integritas mutunya yang sangat presisi perfeksionis dan izinkan penyediaan keleluasaan tambahan waktu pengujian komprehensif (comprehensive phase testing) secara wajar.',
      'Akomodasi pengisolasian area meja kerja ruang mandiri tenang guna mengoptimalkan level konsentrasi kontemplatif tingkat kognitif mereka.'
    ],
    communicationStyle: 'Sangat baku (formal), mendetail kaku (rigid), penuh kehati-hatian kerangka logika ilmiah, fokus pada pertukaran fakta-bukti komprehensif logis valid, dengan tingkat kehangatan sosial minimalis.',
    idealEnvironment: 'Fasilitas riset independen lanjutan, analisis pengkodean (coding) arsitektur sistem tingkat rumit (complexity high tier), penelitian kepatuhan regulasi (legal compliance drafting) tingkat biro, departemen pendalaman analisis forensik keuangan dan komputasi murni.',
    hrManagementGuide: [
      'Harus senantiasa merumuskan ketetapan parameter standar acuan kriteria kualitas pencapaian, ekspektasi tujuan metrik teknis, beserta instrumen proses evaluasi yang amat jelas tak terbantahkan (black & white objectivity).',
      'Beri ruang kebijakan waktu (grace time frames) yang terprediksi tenang, yang cukup luas untuk aktivitas analisa deduksi data sebelum tenggat akhir hari pengesahan batas keputusan (decision dead-line check).',
      'Rancang pola pembinaan diskusi inkremental untuk mendorong peningkatan pemahaman mereka perihal penerapan fleksibilitas keputusan adaptif serta nilai komersial dari toleransi margin-risiko kewajaran (business pragmatism/risk tolerance optimization).'
    ]
  },
  CS: {
    typeCode: 'CS',
    typeName: 'Compliance-Steadiness (The Precisionist / Specialist)',
    generalDescription: 'Kandidat profil tipe paduan Compliance-Steadiness (CS) merupakan cetak biru (blueprint) representasi dari sosok spesialis keilmuan teknis tingkat tinggi, yang menghadirkan aura penguasaan yang sangat tenang (S), tertata luar biasa rapi klerikal administratif, dan dikaruniai kapabilitas ketelitian tingkat wahid di kelas presisi absolut (C). Mereka bekerja bagaikan perajin (craftsman) ahli—berprogres maju mengeksekusi aktivitas secara bertahap tenang namun melaju senantiasa konsisten repetitif hari-demi-hari secara metodis tepercaya berstandar kepatuhan penuh yang sangat ketat, demi mendedikasikan komitmen tunggal pemeliharaan penjagaan kualitas keakuratan hasil final dokumen/sistem secara sempurna mutlak tanpa sedikit pun menolerir bayang keraguan atau penyimpangan kelemahan klerikal.',
    rolesNarrative: 'Pemetaan matriks kecocokan profesi memproyeksikan kecemerlangan kinerja karir puncak kandidat CS manakala ditunjuk memegang peran jabatan esensial krusial spesialis. Mereka adalah penempatan sumber daya ideal untuk bertugas menangani formulasi redaksi penyusunan panduan teknis mendalam (Technical Writer Executive), pengelola kepala kendali Laboratorium Pengujian Instrumen Validasi, Spesialis Administrator Infrastruktur Sistem Komputer Terpadu (Senior System & Server Administrator), maupun pejabat penyelia Pengawasan Audit Regulasi Kepatuhan Mutu (Regulatory & Quality Control Compliance Specialist). Di lini belakang divisi perbankan akuntansi korporat (Senior Accountant Corporate Audit), peranan eksistensi CS menjadi pilar kokoh perisai yang senantiasa meniadakan peluang kebocoran selisih angka sekecil apa pun.',
    recommendedRoles: [
      'Lead Specialist Technical Documentation Writer / Senior IT System Security Administrator',
      'Chief Laboratory Verification Technologist / Precision Medical Quality Control Head',
      'Senior Corporate Compliance Regulation Officer / Standard Operational Procedure Specialist',
      'Senior Auditing Accountant / Financial Tax Controller / Data Analytics Custodian'
    ],
    strengthsNarrative: 'Kelebihan utama superordinat yang menonjol adalah kapabilitas (endurance) stamina daya konsentrasi analitik berjam-jam (hyper-focus analytical trait) yang sangat stabil luar biasa, kedisiplinan tingkat dewa pengorganisasian (meticulousness) dokumen arsip, dan pengutamaan nilai dedikasi tingkat loyalitas kepatuhan tak tertembus (impenetrable obedience integrity) pada sekumpulan regulasi baku, norma, serta pedoman sumpah etika kerja. Ketahanan CS memformulasikan rutinitas akurasi pengarsipan teknis memastikan bahwa tatanan integritas operasional mesin (organisasi) tidak akan pernah mengalami malfungsi diakibatkan kecerobohan kesalahan pencatatan detail parameter krusial.',
    strengths: [
      'Kapasitas eksekusi tingkat akurasi kualitas performa operasional pencapaian penyelesaian rutinitas kerja harian (daily execution) yang luar biasa sangat presisi akurat dan konsisten anti-fluktuasi.',
      'Sifat dasar pembawaan ketenangan (tranquility), keteraturan sangat rapi terstruktur mapan (well-organized trait), dan cermat runut sangat hati-hati teliti (cautious meticulousness) saat mengorganisir tatanan klasifikasi dokumen perizinan regulasi maupun perbaikan perakitan sistem perangkat lunak (software/hardware).',
      'Mendedikasikan penjagaan proteksi kerahasiaan protokol informasi sensitif tingkat tinggi (high-classified privacy gate-keeper) dengan tingkat kepatuhan moral pengamanan (absolute rule abidance) sangat patuh tanpa kompromi korupsi etis.'
    ],
    weaknessesNarrative: 'Kelemahan esensial yang menjadi penghalang kemajuan CS adalah kelambatan proses adaptasi transisi responsif untuk mengubah (switching) kebiasaan perilaku apabila berhadapan pada kondisi instruksi guncangan perubahan krisis tenggat mendadak, serta kecenderungan batinnya yang amat ekstrim untuk bersikap tertutup mengisolasi diri (withdrawn/self-isolating defense) mengunci semua sarana interaksi verbal tatkala pikiran emosinya mendadak diserang kepanikan batin tertekan (burnout stress). Karena pola orientasi mereka sangat fokus mendalam (tunnel-vision), jika sistemnya diganggu, CS akan gagal mengalihkan (pivot) strategi solusi, kehilangan pijakan adaptasi kognitif.',
    weaknesses: [
      'Sangat rentan terserang (vulnerability to stress) proses kelambatan fatal membeku tak berkutik membutuhkan periode jenjang transisi fase adaptasi durasi panjang (prolonged time) guna mensinkronkan ulang penyesuaian pikiran dengan ritme penugasan eksekusi kerja krisis perubahan yang serba mendadak (spontaneous panic mode).',
      'Perilaku yang bertendensi terlampau tertutup pendiam mendarah daging (extreme internal introvert profile) dalam perkara merespon penyampaian eskpresi menyuarakan keberadaan potensi blokade (bottleneck/obstacles) kendala personalia hambatan di lapangan teknis sedari dini.',
      'Kehilangan pandangan makro (tunnel-vision/big-picture loss) akibat terjebak berputar-putar obsesi kehati-hatian keakuratan pengerjaan mikroskopis tanpa toleransi prioritas.'
    ],
    conflictsNarrative: 'Sumber pemicu ledakan akar potensi pusaran konflik (vortex-trigger) krisis demotivasi fatal yang paling destruktif bagi jiwa psikologis produktivitas tipe CS akan segera meledak ke permukaan apabila rutinitas kendali sistem mereka dihadapkan disrupsi guncangan tuntutan tekanan model eksekusi urutan penyelesaian instruksi kerja paksaan (force majeure pressure) serba acak, serabutan ganda (simultaneous random task switching), dan jadwal agenda yang selalu silih-berganti bongkar-pasang (erratic shifting agendas) setiap saat tiada henti, tanpa kepastian alokasi pembagian porsi tenggat penyelesaian jadwal pasti, dan tuntutan revisi berulang-ulang dari pihak atasan eksekutif (top-level micro interruption). Insiden stresor kronis tersebut memicu kehancuran kualitas (quality burnout breakdown).',
    potentialConflicts: [
      {
        trigger: 'Pembebanan intensi bombardir instruksi tuntutan penyelesaian kerja yang tumpang-tindih, melompat-lompat acak, berpotensi silih berganti perubahan jadwal setiap detik per detik waktu.',
        impact: 'Kandidat (CS profile) akan menanggung krisis lonjakan intensitas skala stres kepanikan sangat akut, berdampak merembet memunculkan eskalasi kehancuran kualitas kepuasan kerja (job satisfaction collapse), lalu merespon bersikap pasif-agresif penundaan mutlak mundur dari proses konfrontasi mediasi.',
        solution: 'Diwajibkan menetapkan batasan pemilahan perisai prioritas alokasi (time-boxing & priority scale shielding); mengurutkan rincian tahapan kalender (timeline progression series) susunan urutan sistem (First in - First Out) pengerjaan yang stabil teratur dan dipatuhi semua petinggi (stakeholders).'
      }
    ],
    treatmentsNarrative: 'Formulasi kebijakan paket strategi pendekatan treatment manajerial struktural optimal dan sangat absolut diperlukan (critical prerequisite practice) adalah senantiasa wajib menjamin menyediakan ekosistem fasilitas lingkungan ruang (workspace) kerja sunyi isolasi minim distraksi interupsi, dan wajib senantiasa menerapkan standar prosedur tata cara manajemen pola pembagian tugas komunikasi instruksi redaksi tulisan secara linear, urut, sangat terstruktur jelas, tak terbantahkan satu arah tanpa keraguan (crystal clear logical flow instructions).',
    bestTreatments: [
      'Memfasilitasi akomodasi infrastruktur penyediaan lingkungan alokasi ruang (territory placement/enclosure unit) zona kerja yang tenang fokus sepi bebas isolasi, dan meminimalisasi mutlak dari segenap paparan gangguan interupsi kebisingan dinamika ekstroversi lalu-lalang audiens publik luar (distraction-free zone).',
      'Dalam agenda rapat diskusi (coordination/delegation session), wajib senantiasa bicarakan sampaikan penjabaran pembagian ekspektasi perolehan tujuan parameter kesuksesan KPI (Key Performance Indicator criteria) secara rinci terdokumentasi (written log agenda) dalam format daftar instruksi berurutan sistematis kronologis logis logis baku.',
      'Cegah (intercept block) pihak-pihak departemen eksternal komersial dari aktivitas pelecehan pemaksaan "interupsi titipan percepatan dadakan" (by-pass ad hoc urgency) kepada CS (Compliance-Steadiness agent).'
    ],
    communicationStyle: 'Sangat rapi terstruktur cermat tertata tata krama penuh menjunjung tinggi kesopanan (courteous mannerism), pembawaan ekspresi kalem senyap berkarakter metodis serius formalitas baku.',
    idealEnvironment: 'Markas departemen biro spesialis keilmuan pakar dokumentasi pemrosesan verifikasi akurasi data teknis murni (technical specialist hub), perpustakaan pengelolaan penataan klasifikasi laci arsip rekap, ruang sterilisasi inspeksi akurasi audit mutu kualitas, serta koridor tim pakar validasi laboratorium analisis.',
    hrManagementGuide: [
      'Lindungi dan pastikan ketersediaan penyediaan jatah alokasi ruang (bubble territory area) kawasan sentra zona kerja kondusif tenang secara optimal yang difungsikan murni eksklusif (dedicated unit zone) dalam menjamin tercapainya tingkatan elevasi level perolehan konsentrasi dedikasi tingkat presisi tertinggi CS di saat mengeksekusi analisis.',
      'Disiplin secara rigoristik perihal kepastian penjagaan penentuan penyusunan pembatasan penjadwalan penetapan jaminan keselarasan kepastian tenggat akhir (absolute rigid but logical realistic deadline limit management) guna memastikan standar kelayakan waktu (buffer allowance) perlindungan ketelitian kontrol kualitas mutu pengerjaan tidak dikompromikan merosot oleh desakan komersial artifisial semu belaka.',
      'Sediakan wahana rutinitas (routine mechanism session) sesi satu-lawan-satu pengasuhan bimbingan tertutup privat (one-on-one closed safe space mentoring) dalam rangka menggali mendeteksi (probing detection) deteksi dini kemungkinan terjadinya akumulasi tumpukan keluh-kesah penumpukan hambatan isolasi mental tertekan emosional.'
    ]
  }
};

export function getDiscProfileInterpretation(dominantCode: string): DiscProfileInterpretation {
  const cleanCode = dominantCode.toUpperCase().trim();
  if (DISC_PROFILES[cleanCode]) return DISC_PROFILES[cleanCode];

  const twoChars = cleanCode.substring(0, 2);
  if (DISC_PROFILES[twoChars]) return DISC_PROFILES[twoChars];

  const oneChar = cleanCode.substring(0, 1);
  if (DISC_PROFILES[oneChar]) return DISC_PROFILES[oneChar];

  return {
    typeCode: cleanCode,
    typeName: `${cleanCode} Personality Profile`,
    generalDescription: 'Individu memiliki kombinasi gaya perilaku yang adaptif sesuai tuntutan tugas dan lingkungan kerja.',
    rolesNarrative: 'Kandidat diproyeksikan fleksibel ditempatkan pada berbagai peran pendukung operasional generalist.',
    recommendedRoles: ['Peran Operasional Generalist', 'Spesialis Pendukung Proyek'],
    strengthsNarrative: 'Memiliki kemampuan adaptasi gaya kerja yang fleksibel sesuai tuntutan tim.',
    strengths: ['Fleksibel dalam penyesuaian gaya kerja', 'Mampu bekerja dalam tim maupun mandiri'],
    weaknessesNarrative: 'Memerlukan kejelasan dalam penentuan urutan prioritas.',
    weaknesses: ['Perlu penyesuaian berkala terhadap skala prioritas'],
    conflictsNarrative: 'Konflik dapat timbul apabila terdapat ambisuitas dalam rincian tugas.',
    potentialConflicts: [
      {
        trigger: 'Ambuitas peran.',
        impact: 'Keraguan bertindak.',
        solution: 'Kejelasan deskripsi tugas.'
      }
    ],
    treatmentsNarrative: 'Berikan pengarahan yang jelas dan evaluasi berkala secara bersahabat.',
    bestTreatments: ['Berikan arahan yang terstruktur dan evaluasi berkala.'],
    communicationStyle: 'Adaptif dan komunikatif.',
    idealEnvironment: 'Lingkungan kerja kolaboratif dengan kejelasan target.',
    hrManagementGuide: ['Fasilitasi pembinaan berkala dan keselarasan peran kerja.']
  };
}


export const BIG_FIVE_NARRATIVES = {
  E: {
    Tinggi: 'Memiliki motivasi tinggi dalam bergaul, menjalin hubungan sosial, dan cenderung dominan dalam lingkungannya. Energik, antusias, dan mudah berinteraksi dengan orang lain.',
    Sedang: 'Cukup nyaman dalam situasi sosial, namun juga menghargai waktu sendiri. Dapat beradaptasi antara situasi ramai dan tenang.',
    Rendah: 'Lebih suka aktivitas yang tenang dan menyendiri. Cenderung pendiam dan lebih selektif dalam bersosialisasi.'
  },
  A: {
    Tinggi: 'Ramah, mudah memaafkan, menghindari konflik, dan memiliki kecenderungan kooperatif. Menunjukkan perhatian dan empati yang tinggi terhadap orang lain.',
    Sedang: 'Memiliki keseimbangan antara kepercayaan dan skeptisisme. Dapat bekerja sama namun tetap mempertahankan pendiriannya bila perlu.',
    Rendah: 'Cenderung kompetitif, kritis, dan lebih mengutamakan kepentingan pribadi daripada kelompok.'
  },
  C: {
    Tinggi: 'Terencana, terorganisir, dan disiplin. Memiliki kontrol diri yang baik, berorientasi pada tujuan, dan dapat diandalkan dalam menyelesaikan tugas.',
    Sedang: 'Cukup teratur dan bertanggung jawab, namun masih fleksibel dan tidak terlalu kaku dalam mengikuti rencana.',
    Rendah: 'Cenderung spontan, kurang terstruktur, dan mudah terganggu dalam menyelesaikan tugas.'
  },
  N: {
    Tinggi: 'Mudah mengalami tekanan emosional, cemas, dan stres. Membutuhkan dukungan emosional lebih tinggi dalam situasi menekan.',
    Sedang: 'Memiliki stabilitas emosi yang cukup baik. Dapat mengendalikan diri meskipun menghadapi situasi cemas tertentu.',
    Rendah: 'Tenang, stabil secara emosi, dan tidak mudah terganggu oleh tekanan. Mampu mengatasi stres dengan baik.'
  },
  O: {
    Tinggi: 'Kreatif, imajinatif, dan terbuka terhadap pengalaman baru. Memiliki kapasitas tinggi untuk menyerap informasi dan menjelajahi ide-ide baru.',
    Sedang: 'Memiliki keseimbangan antara apresiasi hal baru dan kenyamanan dengan rutinitas.',
    Rendah: 'Cenderung konvensional, lebih menyukai rutinitas, dan kurang tertarik pada hal-hal abstrak atau artistik.'
  }
};
