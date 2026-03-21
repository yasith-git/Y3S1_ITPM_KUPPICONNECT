import { dummyClasses } from '../../../data/dummyData';

const SUBJECT_CLS = {
  Mathematics: 'bg-blue-50 text-blue-700 border-blue-100',
  Physics:     'bg-purple-50 text-purple-700 border-purple-100',
  Chemistry:   'bg-green-50 text-green-700 border-green-100',
  Biology:     'bg-orange-50 text-orange-700 border-orange-100',
};

function ClassManagementPage() {
  const totalEnrolled = dummyClasses.reduce((s, c) => s + c.enrolled, 0);
  const totalSeats    = dummyClasses.reduce((s, c) => s + c.seats, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Conductor Portal</p>
          <h1 className="text-3xl font-bold text-ink">Class Management</h1>
          <p className="text-sub text-sm mt-1">Manage and organise your kuppi sessions.</p>
        </div>
        <button className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[0_4px_16px_rgba(13,148,136,0.4)] flex items-center gap-2">
          + New Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Classes',   value: dummyClasses.length, icon: '🗓️' },
          { label: 'Total Enrolled',  value: totalEnrolled,       icon: '🎓' },
          { label: 'Total Seats',     value: totalSeats,          icon: '💺' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-rim rounded-2xl p-5 flex items-center gap-4 hover:shadow-[0_4px_20px_rgba(13,148,136,0.12)] hover:border-primary/30 hover:-translate-y-0.5 transition-all">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="text-dim text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Classes list */}
      <div className="bg-card border border-rim rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-rim flex items-center justify-between">
          <h2 className="font-bold text-ink">All Classes</h2>
          <span className="text-xs text-dim">{dummyClasses.length} classes</span>
        </div>
        <div className="divide-y divide-rim">
          {dummyClasses.map(cls => {
            const fillPct = Math.round((cls.enrolled / cls.seats) * 100);
            const isFull  = cls.enrolled >= cls.seats;
            const subCls  = SUBJECT_CLS[cls.subject] || 'bg-section text-sub border-rim';
            return (
              <div key={cls.id} className="px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-section/60 hover:to-card transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-section rounded-xl flex items-center justify-center text-primary font-bold text-sm border border-rim flex-shrink-0">
                    {cls.subject.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{cls.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${subCls}`}>{cls.subject}</span>
                      <span className="text-dim text-xs">{cls.date} · {cls.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4 flex-shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-ink">{cls.enrolled}/{cls.seats}</p>
                    <div className="w-20 h-1.5 bg-section rounded-full mt-1 overflow-hidden border border-rim">
                      <div className={`h-full rounded-full ${isFull ? 'bg-err' : 'bg-gradient-to-r from-primary to-secondary'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm hidden sm:block">Rs. {cls.fee}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isFull ? 'bg-red-50 text-err' : 'bg-green-50 text-ok'}`}>
                    {isFull ? 'Full' : 'Open'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="border border-rim text-sub hover:text-ink hover:border-field text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                    <button className="border border-err/30 text-err hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ClassManagementPage;
