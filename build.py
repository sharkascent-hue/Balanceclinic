#!/usr/bin/env python3
"""Generates every page of the Balance Clinic site from the data below.
Run `python3 build.py` after editing copy, treatments, prices or posts."""
import os, re, html

ROOT = os.path.dirname(os.path.abspath(__file__))
PHONE = "(046) 906 0333"
ADDRESS = "8 Trimgate Street, Townparks, Navan, Co. Meath, C15 DHE9"
MAPS = "https://www.google.com/maps/search/?api=1&query=Balance+Clinic+Spa+Beauty+8+Trimgate+St+Navan"
GOOGLE_REVIEWS = "https://www.google.com/search?q=Balance+Clinic+Spa+Beauty+Navan+reviews"
WEB3FORMS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"   # paste the key from web3forms.com to switch the forms on

ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 4l4 4-4 4"/></svg>'
PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>'

# ---------------------------------------------------------------- treatments
GROUPS = [
    ("body", "Body Treatments", "Laser, contouring, waxing and massage for the whole body."),
    ("skin-concerns", "Skin Concerns", "Understand what is happening and which treatment answers it."),
    ("beauty", "Beauty Treatments", "Nails, lashes and brows finished to a clinic standard."),
    ("skin", "Skin Treatments", "Medical-grade skin work: peels, IPL and microneedling."),
]

T = []
def treatment(**k): T.append(k)

treatment(slug="laser-hair-removal", group="body", title="Laser Hair Removal", em="Laser", img="laser.jpg",
    short="Medical-grade laser for smooth, lasting results on face and body.",
    intro="Medical-grade laser hair removal targets the hair follicle at the root. Over a course of sessions the hair grows back finer and sparser until most areas need only an occasional top-up.",
    body=["Our laser is a medical-grade system operated by trained therapists, with settings chosen for your skin tone and hair type after a patch test.",
          "Hair grows in cycles, so a course is needed to catch each follicle in its active phase. Most clients see a clear reduction after three sessions."],
    benefits=["Face, underarms, bikini, legs, back and chest", "Suitable for most skin types after a patch test", "Sessions take 10 to 60 minutes depending on the area", "No ingrown hairs, no regrowth stubble"],
    steps=[("Consultation and patch test", "We assess your skin and hair, explain the plan and test a small area."), ("Course of sessions", "Typically 6 to 8 sessions spaced 4 to 8 weeks apart."), ("Maintenance", "An occasional top-up keeps the area smooth.")],
    facts=[("Sessions", "6 to 8"), ("Time", "10 to 60 min"), ("Downtime", "None"), ("Patch test", "Required")],
    faqs=[("Does it hurt?", "Most people describe a quick warm flick, like an elastic band. The handpiece cools the skin as it works."), ("Can I shave between sessions?", "Yes. Shave the area 24 hours before each session, but avoid waxing or plucking during your course."), ("How soon will I see results?", "Hair sheds 1 to 3 weeks after each session. Regrowth becomes noticeably finer from the third session.")])

treatment(slug="body-contouring", group="body", title="Body Contouring", em="Contouring", img="contour.jpg",
    short="Venus Legacy radio-frequency to tighten skin and smooth cellulite.",
    intro="Venus Legacy combines multi-polar radio frequency with pulsed electromagnetic fields to warm the deeper layers of skin, stimulate collagen and reduce the look of cellulite. No needles, no downtime.",
    body=["Treatment feels like a warm, deep massage. The applicator glides over the area while the tissue is gently heated to the temperature at which collagen responds.",
          "It is used for the abdomen, thighs, arms, glutes and the face and neck, and it is often combined with skin tightening for a firmer overall result."],
    benefits=["Reduces the appearance of cellulite", "Tightens loose skin after weight change or pregnancy", "Contours abdomen, thighs, arms and glutes", "Comfortable, with no recovery time"],
    steps=[("Consultation", "We map the areas you want to treat and photograph them for progress."), ("Course", "A course of 6 to 8 weekly sessions gives the best result."), ("Review", "We compare photos at the end of the course and plan maintenance.")],
    facts=[("Sessions", "6 to 8"), ("Time", "30 to 60 min"), ("Downtime", "None"), ("Feels like", "A warm massage")],
    faqs=[("When do results show?", "Skin often looks smoother after the first few sessions, with the full effect developing over the 3 months that follow a course."), ("Is it safe?", "Venus Legacy is a non-invasive, clinically established technology. We check your medical history at consultation."), ("Can I exercise afterwards?", "Yes. Drink plenty of water and carry on as normal.")],
    compare="jaw")

treatment(slug="waxing", group="body", title="Waxing", em="Waxing", img="beauty.jpg",
    short="Fast, clean waxing with gentle hot and strip wax.",
    intro="Hot wax for sensitive areas, strip wax for larger ones, and therapists who do this every day. Clean, quick and as comfortable as waxing can be.",
    body=["We use a low-temperature hot wax for the face, underarms and bikini, which grips the hair rather than the skin, and strip wax for legs, arms and back."],
    benefits=["Full face, brow and lip", "Underarm, bikini, Hollywood and Brazilian", "Half and full leg, arms, back and chest", "Soothing aftercare included"],
    steps=[("Grow it", "Hair should be about 5 mm, roughly two weeks of growth."), ("Wax", "Most appointments take 15 to 45 minutes."), ("Aftercare", "Keep the area cool and avoid heat, tanning and tight clothing for 24 hours.")],
    facts=[("Time", "15 to 45 min"), ("Regrowth", "3 to 5 weeks"), ("Downtime", "None"), ("Wax", "Hot and strip")],
    faqs=[("Can I wax if I use retinol?", "Stop retinol products on the area for a week before a facial wax, and tell your therapist about any skin medication."), ("Does it get easier?", "Yes. Regular waxing weakens the follicle, so hair returns finer and less dense.")])

treatment(slug="massage", group="body", title="Massage", em="Massage", img="massage.jpg",
    short="Swedish, deep tissue, Indian head, hot stone and pregnancy massage.",
    intro="A quiet room, warm towels and a therapist who reads what your body needs. Choose a style or tell us how you feel and we will tailor it.",
    body=["Swedish massage for relaxation and circulation. Deep tissue for stubborn knots and tension. Hot stone for warmth that reaches deep into the muscle. Indian head for the scalp, neck and shoulders. Pregnancy massage adapted for comfort in every trimester after the first."],
    benefits=["Swedish, deep tissue, hot stone", "Indian head massage", "Pregnancy massage", "Back, neck and shoulder or full body"],
    steps=[("Tell us", "A short chat about tension, injuries and pressure."), ("Treatment", "30, 60 or 90 minutes."), ("Rest", "Water, a few minutes of quiet and you are back to the day.")],
    facts=[("Time", "30 to 90 min"), ("Pressure", "Your choice"), ("Downtime", "None"), ("Add on", "Hot stones")],
    faqs=[("Which massage should I book?", "If you are unsure, book a full body and tell your therapist what you want from it. They will blend styles."), ("Can I have a massage while pregnant?", "Yes, from the second trimester, with a therapist trained in pregnancy massage.")])

treatment(slug="what-is-cellulite", group="skin-concerns", title="What Is Cellulite?", em="Cellulite", img="body.jpg",
    short="What causes dimpled skin and which treatments actually help.",
    intro="Cellulite is the dimpled, uneven texture that appears when fat cells push against the connective bands under the skin. It affects most women, at every size, and it responds to the right treatment.",
    body=["The bands that anchor skin to muscle run vertically in women, so when fat cells enlarge or skin loses firmness the surface puckers between them. Hormones, genetics, circulation and skin thickness all play a part.",
          "Creams cannot reach the structure that causes it. Radio-frequency treatment such as Venus Legacy warms the deeper tissue, stimulates collagen and improves circulation, which smooths the surface over a course."],
    benefits=["Most visible on thighs, glutes and abdomen", "Not caused by weight alone", "Improves with collagen stimulation and circulation", "Best treated as a course, then maintained"],
    steps=[("Consultation", "We grade the cellulite and photograph the area."), ("Venus Legacy course", "6 to 8 weekly sessions of radio-frequency."), ("Maintenance", "A session every 1 to 3 months holds the result.")],
    facts=[("Treated with", "Venus Legacy"), ("Sessions", "6 to 8"), ("Downtime", "None"), ("Results", "Build over 3 months")],
    faqs=[("Will exercise remove it?", "Exercise helps tone the muscle underneath and improves circulation, but it rarely removes cellulite on its own."), ("Does the result last?", "With maintenance sessions and a steady weight, yes.")])

treatment(slug="anti-ageing-hydration", group="skin-concerns", title="Anti-Ageing & Hydration", em="Hydration", img="skin.jpg",
    short="Fine lines, dullness and dehydration, treated from the inside out.",
    intro="From our mid twenties we lose about one percent of collagen each year. Hydration drops, texture roughens and fine lines settle in. We rebuild from below with treatments chosen for your skin.",
    body=["Microneedling and peels prompt the skin to make new collagen. Elemis Biotec and CACI lift and firm with electrical currents and LED. Alumier MD and Dermalogica facials restore the barrier and lock in moisture.",
          "Your consultation decides the mix. Most clients start with a course and move to a monthly facial."],
    benefits=["Fine lines and loss of firmness", "Dull, dehydrated or uneven skin", "Pigmentation and sun damage", "Tailored home care to hold the result"],
    steps=[("Skin analysis", "We look at texture, hydration, pigmentation and lines."), ("Course", "Typically 3 to 6 treatments, 2 to 4 weeks apart."), ("Maintain", "A facial every 4 to 6 weeks and the right products at home.")],
    facts=[("Approach", "Course then maintain"), ("Options", "Peels, needling, CACI"), ("Downtime", "0 to 2 days"), ("Home care", "Alumier MD, Dermalogica")],
    faqs=[("Where do I start?", "Book a skin consultation. We will recommend one treatment to begin with and build from there."), ("Can treatments be combined?", "Yes. Many of our best results come from pairing a collagen treatment with a hydrating facial.")],
    compare="texture")

treatment(slug="nails-manicure", group="beauty", title="Nails & Manicure", em="Nails", img=None,
    short="Classic, gel and luxury manicures with immaculate finish.",
    intro="A tidy, well-shaped set of nails is the fastest finish there is. Classic polish, long-wear gel or a luxury manicure with hand massage and mask.",
    body=["We shape, tidy cuticles, buff and finish with your choice of polish. Gel manicures cure under LED for a chip-free fortnight or more."],
    benefits=["Classic file and polish", "Gel manicure, 2 to 3 weeks of wear", "Luxury manicure with scrub, mask and massage", "Gel removal and nail repair"],
    steps=[("Shape", "File, cuticle work and buff."), ("Colour", "Polish or gel, cured under LED."), ("Finish", "Oil and hand cream.")],
    facts=[("Time", "30 to 60 min"), ("Gel wear", "2 to 3 weeks"), ("Downtime", "None"), ("Removal", "Book with your next set")],
    faqs=[("How long does gel last?", "Two to three weeks with normal wear."), ("Do you remove gel from another salon?", "Yes. Add removal when booking.")])

treatment(slug="lashes", group="beauty", title="Lashes", em="Lashes", img=None,
    short="Lash lifts and extensions for a wide-awake look.",
    intro="A lash lift curls your own lashes from the root for 6 to 8 weeks. Extensions add length and volume lash by lash. Both wake up the eyes without daily mascara.",
    body=["Lash lifts are tinted for extra definition. Extensions come in classic, hybrid and volume sets, applied individually and refilled every 2 to 3 weeks."],
    benefits=["Lash lift and tint", "Classic, hybrid and volume extensions", "Infills every 2 to 3 weeks", "Patch test 48 hours before a first appointment"],
    steps=[("Patch test", "48 hours before your first lash treatment."), ("Treatment", "45 minutes for a lift, up to 2 hours for a full set."), ("Care", "Keep lashes dry for 24 hours and brush daily.")],
    facts=[("Lift lasts", "6 to 8 weeks"), ("Full set", "Up to 2 hrs"), ("Infills", "2 to 3 weeks"), ("Patch test", "Required")],
    faqs=[("Lift or extensions?", "A lift suits naturally long lashes and minimal upkeep. Extensions give length and volume you cannot get from your own lashes."), ("Can I wear mascara?", "With a lift, yes after 24 hours. With extensions, avoid it.")])

treatment(slug="pedicure", group="beauty", title="Pedicure", em="Pedicure", img=None,
    short="Restorative pedicures with hard-skin removal and gel polish.",
    intro="Feet carry you everywhere and rarely get thanks. A pedicure here removes hard skin, tidies nails and cuticles and finishes with polish or long-wear gel.",
    body=["Choose a classic pedicure or a luxury version with a warm soak, scrub, mask and lower-leg massage."],
    benefits=["Hard-skin removal", "Nail and cuticle care", "Classic or gel polish", "Luxury pedicure with massage"],
    steps=[("Soak", "Warm soak and hard-skin removal."), ("Shape", "Nails, cuticles and buff."), ("Finish", "Polish or gel and a foot massage.")],
    facts=[("Time", "45 to 75 min"), ("Gel wear", "3 to 4 weeks"), ("Downtime", "None"), ("Best in", "Open shoes")],
    faqs=[("How often should I book?", "Every 4 to 6 weeks keeps feet in good condition."), ("Can you treat very hard skin?", "Yes. Our therapists use professional files and softeners.")])

treatment(slug="expert-brows-lashes", group="beauty", title="Expert Brows & Lashes", em="Brows", img=None,
    short="Million Dollar Brows and precision lash work by expert therapists.",
    intro="Brows frame the face. Our expert brow and lash service combines mapping, shaping, tinting and Million Dollar Brows techniques to create a shape that suits you and lasts.",
    body=["We map your brows to your bone structure first, then shape with wax and tweezers, tint to the right depth and finish with lamination or a lash treatment if you want it."],
    benefits=["Brow mapping and shaping", "Tinting and lamination", "Million Dollar Brows", "Lash lift and tint add-on"],
    steps=[("Map", "We measure and mark the ideal shape."), ("Shape", "Wax, tweeze and tint."), ("Set", "Lamination or brow gel to finish.")],
    facts=[("Time", "30 to 60 min"), ("Tint lasts", "4 to 6 weeks"), ("Lamination", "6 to 8 weeks"), ("Patch test", "Required for tint")],
    faqs=[("What is brow lamination?", "A treatment that sets brow hairs in place so they look fuller and more uniform for up to 8 weeks."), ("Will you change my shape?", "Only with you. Mapping shows the options before anything is removed.")])

treatment(slug="alumier-md-peels", group="skin", title="Alumier MD Peels", em="Peels", img="hero-poster.jpg",
    short="Medical-grade chemical peels for pigmentation, acne and texture.",
    intro="Alumier MD peels are medical-grade resurfacing treatments that lift away dull, damaged surface cells and prompt the skin to renew. Pigmentation fades, breakouts calm and texture smooths.",
    body=["Each peel is chosen for your concern: Glow Peel for radiance and tone, Lactic for dehydrated skin, Salicylic for oily and breakout-prone skin. Peels are only available from clinics with trained Alumier MD professionals.",
          "Most clients book a course of three, two to four weeks apart, with Alumier home care between visits."],
    benefits=["Pigmentation, sun damage and uneven tone", "Acne, congestion and post-breakout marks", "Rough texture and fine lines", "Light flaking for a few days, then noticeably brighter skin"],
    steps=[("Prep", "Two weeks on Alumier home care so the peel works evenly."), ("Peel", "30 to 45 minutes in clinic. Expect tingling, not pain."), ("Renew", "Light flaking on days 2 to 4. Skin looks clearer by day 7.")],
    facts=[("Course", "3 peels"), ("Time", "30 to 45 min"), ("Downtime", "2 to 4 days light flaking"), ("Home care", "Alumier MD")],
    faqs=[("Will my skin peel visibly?", "Usually light flaking, like after a day in the sun. Not everyone flakes at all."), ("Can I have a peel in summer?", "Yes, with daily SPF. We use a lower strength if you are in the sun a lot.")],
    video=("reset.mp4", "reset-poster.jpg", "Your skin deserves a reset"))

treatment(slug="dermalogica-treatments", group="skin", title="Dermalogica Treatments", em="Dermalogica", img="skin.jpg",
    short="Pro skin facials mapped to your skin, with professional-only actives.",
    intro="Dermalogica professional facials start with Face Mapping, a zone-by-zone analysis of your skin, then use professional-strength products to treat what it finds.",
    body=["ProSkin 30 is a targeted treatment for one concern. ProSkin 60 is the full experience: double cleanse, exfoliation, extraction if needed, massage, mask and professional actives. Both can include Pro Power Peel or Pro Bright add-ons."],
    benefits=["Face Mapping skin analysis", "ProSkin 30 and ProSkin 60", "Pro Power Peel and Pro Bright add-ons", "Home-care plan with Dermalogica products"],
    steps=[("Face Mapping", "We analyse 14 zones of the face."), ("Treatment", "30 or 60 minutes, customised on the day."), ("Plan", "A simple routine for home.")],
    facts=[("Time", "30 or 60 min"), ("Downtime", "None"), ("Frequency", "Every 4 to 6 weeks"), ("Products", "Dermalogica")],
    faqs=[("Which facial should I book?", "ProSkin 60 for a first visit. It gives time for a full analysis and treatment."), ("Is it suitable for sensitive skin?", "Yes. The treatment adapts to what Face Mapping shows.")])

treatment(slug="lumenis-stellar-m22-ipl", group="skin", title="Lumenis Stellar M22 IPL", em="IPL", img="rosacea-after.jpg",
    short="Intense pulsed light for redness, rosacea, pigmentation and thread veins.",
    intro="The Lumenis Stellar M22 is a medical-grade IPL platform. Filtered light is absorbed by redness, pigment and broken capillaries, which fade over the weeks after treatment while the surrounding skin is unharmed.",
    body=["It is our treatment of choice for rosacea and facial redness, sun spots and pigmentation, thread veins on the face and legs, and overall photo-rejuvenation.",
          "Many clients see a clear change after a single session. A course of three gives the most even, lasting result."],
    benefits=["Rosacea and facial redness", "Sun damage and age spots", "Thread veins and broken capillaries", "Skin rejuvenation and tone"],
    steps=[("Consultation and patch test", "We confirm suitability and test the settings."), ("Treatment", "20 to 40 minutes. Expect a warm snap with each pulse."), ("Fade", "Redness settles in hours, pigment darkens then flakes off within 1 to 2 weeks.")],
    facts=[("Sessions", "1 to 3"), ("Time", "20 to 40 min"), ("Downtime", "Minimal"), ("Patch test", "Required")],
    faqs=[("Does IPL hurt?", "Each pulse feels like a warm flick. Cooling gel and the M22 sapphire tip keep it comfortable."), ("Can I have IPL with a tan?", "No. Skin must be free of tan, real or fake, for four weeks before treatment.")],
    compare="rosacea")

treatment(slug="microneedling", group="skin", title="Microneedling", em="Microneedling", img="nonsurgical.jpg",
    short="Collagen induction for scarring, texture, pores and fine lines.",
    intro="Microneedling creates thousands of micro-channels in the skin, which triggers the repair process and new collagen. It is one of the most effective treatments we offer for acne scarring, texture and pores.",
    body=["We use a medical-grade pen with sterile, single-use cartridges. Numbing cream makes it comfortable, and the skin is treated with serums chosen for your concern as the channels are open.",
          "Skin looks pink for a day or two and glows within a week. Collagen keeps building for three months after each session."],
    benefits=["Acne scarring and enlarged pores", "Fine lines and loss of firmness", "Uneven texture and tone", "Stretch marks on the body"],
    steps=[("Numb", "Topical anaesthetic for 20 to 30 minutes."), ("Needle", "The pen passes over each area at the depth it needs."), ("Recover", "Pink for 24 to 48 hours, then glowing.")],
    facts=[("Sessions", "3 to 6"), ("Time", "60 min"), ("Downtime", "1 to 2 days"), ("Results", "Build over 3 months")],
    faqs=[("Does microneedling hurt?", "With numbing cream most clients describe it as a vibration. Some areas, like the forehead, feel more than others."), ("How soon can I wear make-up?", "After 24 hours. Use mineral make-up for the first few days.")],
    video=("microneedling.mp4", "microneedling-poster.jpg", "Why microneedling works"))

treatment(slug="microneedling-with-exosomes", group="skin", title="Microneedling with Exosomes", em="Exosomes", img="undereye-after.jpg",
    short="Needling boosted with exosomes for faster repair and deeper renewal.",
    intro="Exosomes are the messengers cells use to tell each other to repair. Applied while microneedling channels are open, they amplify the renewal signal, calm inflammation and speed recovery.",
    body=["The result is a stronger version of microneedling: less redness afterwards, faster healing and a more noticeable change in texture, tone and firmness after each session."],
    benefits=["Faster recovery than standard needling", "Stronger improvement in texture and firmness", "Calms redness and inflammation", "Ideal for scarring, ageing and dull skin"],
    steps=[("Numb", "Topical anaesthetic."), ("Needle and infuse", "Exosome serum applied during and after needling."), ("Recover", "Mild pinkness for about a day.")],
    facts=[("Sessions", "3"), ("Time", "60 to 75 min"), ("Downtime", "About 1 day"), ("Boost", "Exosome serum")],
    faqs=[("What are exosomes made from?", "Lab-cultured, cell-derived vesicles that are purified and sterile. They contain no live cells."), ("Is it worth the upgrade?", "If you want faster recovery and a stronger result per session, yes.")],
    compare="undereye")

treatment(slug="idenel-liquid-microneedling", group="skin", title="Idenel Liquid Microneedling", em="Idenel", img="eyes-after.jpg", new=True,
    short="Needle-free renewal: the results of microneedling with no needles at all.",
    intro="Idenel is a new liquid microneedling treatment. A patented formula creates micro-channels in the skin the way needles would, delivering actives deep into the skin with no device, no bleeding and no numbing.",
    body=["It suits clients who want the lift and glow of needling without the needles, and delicate areas such as the eyes, neck and hands.",
          "Skin feels warm and looks flushed for a few hours, then clearer and tighter over the following days."],
    benefits=["No needles, no numbing cream", "Delicate areas: eyes, neck, hands", "Brightens, tightens and smooths", "Can be combined with facials and peels"],
    steps=[("Cleanse", "Skin is prepared and the formula applied."), ("Activate", "A warm, tingling sensation for 10 to 15 minutes."), ("Glow", "Flushed for a few hours, brighter by the next day.")],
    facts=[("Sessions", "3 to 4"), ("Time", "45 min"), ("Downtime", "A few hours"), ("Needles", "None")],
    faqs=[("Is it as effective as needling?", "For brightening, tightening and hydration it is close. Deep scarring still responds best to the pen."), ("Can I have it before an event?", "Yes, two to three days before.")],
    compare="eyes")

for _t in T:
    _t["name"] = _t["title"]                      # plain text
    _t["title"] = html.escape(_t["title"], quote=False)
    _t["short"] = html.escape(_t["short"], quote=False)
TMAP = {t["slug"]: t for t in T}

# ---------------------------------------------------------------- results, reels, posts
RESULTS = [
    ("jaw", "Jawline & neck tightening", "Venus Legacy skin tightening, profile view"),
    ("undereye", "Under-eye darkness", "Polynucleotide treatment under the eye"),
    ("rosacea", "Redness · after 1 treatment", "Lumenis M22 IPL for rosacea"),
    ("eyes", "Eye area rejuvenation", "Brighter, firmer under-eyes"),
    ("texture", "Texture & pigmentation", "Peels and microneedling for texture"),
    ("lips", "Lip hydration", "Hydrated, defined lips"),
]
RATIO = {"jaw": "603/1395", "rosacea": "603/935", "undereye": "1000/629", "eyes": "1000/631", "texture": "1000/633", "lips": "1000/627"}
REELS = [
    ("microneedling.mp4", "microneedling-poster.jpg", "Why microneedling works", "It is all about collagen. Tiny channels tell the skin to rebuild itself."),
    ("lumadoc.mp4", "lumadoc-poster.jpg", "Polynucleotides for tired eyes", "Dark circles and crepey skin under the eye, treated with LumaDoc."),
    ("reset.mp4", "reset-poster.jpg", "Your skin deserves a reset", "Dull skin, uneven texture, stubborn pigmentation and post-breakout marks."),
]
POSTS = [
    dict(slug="why-microneedling-works", title="Why microneedling works", date="Skin · 4 min read", img="microneedling-poster.jpg", video=("microneedling.mp4", "microneedling-poster.jpg"),
         summary="It is all about collagen. Here is what happens under the skin after a treatment.",
         body=["<p>Collagen is the scaffolding that keeps skin firm, smooth and plump. From our mid twenties we lose about one percent of it a year, and sun, stress and breakouts speed that up. Fine lines settle in, pores look larger and old scars stop fading.</p>",
               "<h2>Stimulating it again</h2><p>Microneedling creates thousands of microscopic channels in the skin. Each one is a tiny, controlled injury, and the body answers injury with repair. Growth factors flood the area, fibroblasts switch on and new collagen and elastin are laid down over the following weeks.</p>",
               "<p>Because the channels are so small, the surface heals within a day or two. The remodelling underneath carries on for about three months, which is why results keep improving long after you leave the clinic.</p>",
               "<h2>What it is best for</h2><p>Acne scarring, enlarged pores, uneven texture and early lines respond best. A course of three to six sessions, four to six weeks apart, gives the strongest result. Adding exosomes speeds recovery and deepens the response.</p>",
               '<p><a class="link" href="../treatments/microneedling.html">Read about microneedling at Balance ' + ARROW + '</a></p>']),
    dict(slug="your-skin-deserves-a-reset", title="Your skin deserves a reset", date="Skin · 3 min read", img="reset-poster.jpg", video=("reset.mp4", "reset-poster.jpg"),
         summary="Dull skin, uneven texture, stubborn pigmentation, post-breakout marks. A peel is where we start.",
         body=["<p>Skin that looks tired usually has one thing in common: a build-up of dead cells on the surface. Light scatters off it instead of bouncing back, pigment sits in it, and products cannot get through it.</p>",
               "<h2>Resurfacing, properly</h2><p>An Alumier MD peel dissolves that layer in a controlled way and signals the skin to renew. Pigmentation lifts, post-breakout marks fade and texture smooths. Downtime is a few days of light flaking, not a week indoors.</p>",
               "<p>We prepare your skin with two weeks of home care first so the peel works evenly, then book a course of three, spaced two to four weeks apart.</p>",
               '<p><a class="link" href="../treatments/alumier-md-peels.html">See Alumier MD peels ' + ARROW + '</a></p>']),
    dict(slug="polynucleotides-for-tired-eyes", title="Polynucleotides for tired eyes", date="Skin · 5 min read", img="undereye-after.jpg", video=("lumadoc.mp4", "lumadoc-poster.jpg"),
         summary="Dark circles and crepey skin under the eye are hard to treat. Polynucleotides change that.",
         body=["<p>The skin under the eye is the thinnest on the body. It loses collagen early, shows every shadow and reacts badly to aggressive treatment. For years the options were concealer or filler.</p>",
               "<h2>Repair, not volume</h2><p>Polynucleotides are purified DNA fragments that signal the skin to repair itself. Injected in a series of tiny deposits, they improve hydration, thickness and elasticity, so darkness lifts and the crepey texture smooths. The LumaDoc protocol we use is designed for this delicate area.</p>",
               "<p>Most clients have two to three sessions, three weeks apart, and see the change build over two months.</p>",
               '<p><a class="link" href="../book/online-consultation.html">Book an online consultation ' + ARROW + '</a></p>'], compare="undereye"),
    dict(slug="what-cellulite-really-is", title="What cellulite really is", date="Body · 3 min read", img="contour.jpg",
         summary="It is not about weight. It is about the bands under the skin, and radio frequency reaches them.",
         body=["<p>Cellulite affects around nine in ten women at every size. It appears when fat cells push up against the fibrous bands that anchor skin to muscle, puckering the surface between them.</p>",
               "<h2>Why creams fail</h2><p>The structure that causes cellulite sits well below where a cream can reach. Treatment has to warm the deeper tissue, stimulate collagen and improve circulation.</p>",
               "<h2>What works</h2><p>Venus Legacy does exactly that with multi-polar radio frequency and pulsed electromagnetic fields. A course of six to eight sessions smooths the surface and tightens the skin, with no downtime.</p>",
               '<p><a class="link" href="../treatments/what-is-cellulite.html">More on cellulite ' + ARROW + '</a></p>']),
]

PRICES = [
    ("Medical Grade Laser", [("Laser hair removal, small area", "Lip, chin or underarm"), ("Laser hair removal, medium area", "Bikini, half leg or half arm"), ("Laser hair removal, large area", "Full leg, back or chest"), ("Laser skin rejuvenation", ""), ("Thread vein removal", "")]),
    ("Skin Treatments", [("Alumier MD peel", "Course of 3 available"), ("Dermalogica ProSkin 30", ""), ("Dermalogica ProSkin 60", ""), ("Lumenis Stellar M22 IPL", "Face"), ("Microneedling", "Course of 3 available"), ("Microneedling with exosomes", ""), ("Idenel liquid microneedling", "New")]),
    ("Body Treatments", [("Venus Legacy body contouring", "Per area, courses available"), ("Venus Legacy facial skin tightening", ""), ("Swedish massage", "30 / 60 min"), ("Deep tissue massage", "30 / 60 min"), ("Hot stone massage", "60 min"), ("Indian head massage", ""), ("Pregnancy massage", "60 min")]),
    ("Beauty", [("Manicure", "Classic / gel"), ("Pedicure", "Classic / gel"), ("Lash lift and tint", ""), ("Lash extensions", "Classic / hybrid / volume"), ("Brow shape and tint", ""), ("Million Dollar Brows", ""), ("Waxing", "From lip to full leg"), ("Spray tan", "")]),
]

# ---------------------------------------------------------------- shared html
PRE = """<script>(function(){try{var d=document.documentElement;d.className=d.className.replace('no-js','');if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('anim');if(sessionStorage.getItem('bc-pt')==='1')d.classList.add('pt-in');if(sessionStorage.getItem('bc-intro'))d.classList.add('intro-seen');setTimeout(function(){d.classList.remove('anim')},3000)}catch(e){}})()</script>"""
def head(title, desc, rel, extra=""):
    return f'''<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="theme-color" content="#1C3A2A">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{rel}assets/img/hero-poster.jpg">
<link rel="icon" href="{rel}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap">
<link rel="stylesheet" href="{rel}assets/css/site.css">
{PRE}
{extra}</head>
<body>
<video class="bgvid" autoplay muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1" src="{rel}assets/video/bg.mp4"></video>
<div class="bgveil" aria-hidden="true"></div>
<canvas id="bgfx" aria-hidden="true"></canvas>
'''

PLUS_PATH = '<path d="M32 10v44M10 32h44"/>'
def intro():
    return f'''<div id="intro" aria-hidden="true">
  <div class="slats"><div class="slat"></div><div class="slat"></div><div class="slat"></div><div class="slat"></div><div class="slat"></div><div class="slat"></div></div>
  <div class="mark">
    <svg class="plus" viewBox="0 0 64 64">{PLUS_PATH}</svg>
    <div class="word"><img src="ASSETS/img/logo-white.png" alt=""></div>
    <div class="tag">Clinic · Spa · Beauty</div>
  </div>
</div>
'''
def pt():
    return f'<div id="pt" aria-hidden="true"><svg class="plus" viewBox="0 0 64 64">{PLUS_PATH}</svg></div>\n'

def header(rel, current):
    nav = [("Treatments", "treatments/index.html", "treatments"), ("Results", "results/index.html", "results"), ("About", "about/index.html", "about"), ("Price List", "price-list.html", "prices"), ("Shop", "shop/index.html", "shop"), ("Blog", "blog/index.html", "blog"), ("Contact", "contact.html", "contact")]
    links = "".join(f'<a href="{rel}{h}"{" aria-current=\"page\"" if k == current else ""}>{t}</a>' for t, h, k in nav)
    groups = "".join(f'<div><h4>{g[1]}</h4>' + "".join(f'<a href="{rel}treatments/{t["slug"]}.html">{t["title"]}</a>' for t in T if t["group"] == g[0]) + "</div>" for g in GROUPS)
    return f'''<header class="site-head" id="head">
  <a class="brand" href="{rel}index.html" aria-label="Balance Clinic Spa Beauty, home"><img src="{rel}assets/img/logo-white.png" alt="Balance Clinic · Spa · Beauty"></a>
  <nav class="site-nav" aria-label="Primary">{links}</nav>
  <div class="head-cta">
    <a class="btn btn-moss" href="{rel}book/index.html">Book now</a>
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><i></i><i></i><i></i></button>
  </div>
</header>
<div class="menu" id="menu" data-lenis-prevent>
  <div class="inner">
    <nav class="primary" aria-label="Menu">
      <a href="{rel}index.html">Home</a>
      <a href="{rel}treatments/index.html">Treatments<i>16</i></a>
      <a href="{rel}results/index.html">Results</a>
      <a href="{rel}about/index.html">About</a>
      <a href="{rel}price-list.html">Price List</a>
      <a href="{rel}shop/index.html">Shop</a>
      <a href="{rel}book/index.html">Book Now</a>
      <a href="{rel}contact.html">Contact</a>
      <a href="{rel}blog/index.html">Blog</a>
    </nav>
    <div class="groups">{groups}</div>
    <div class="foot"><span>{ADDRESS}</span><span>{PHONE}</span></div>
  </div>
</div>
<div class="page">
'''

def footer(rel):
    body = "".join(f'<li><a href="{rel}treatments/{t["slug"]}.html">{t["title"]}</a></li>' for t in T if t["group"] == "body")
    skin = "".join(f'<li><a href="{rel}treatments/{t["slug"]}.html">{t["title"]}</a></li>' for t in T if t["group"] == "skin")
    return f'''</div>
<footer>
  <div class="inner">
    <div class="brand"><img src="{rel}assets/img/logo-white.png" alt="Balance Clinic · Spa · Beauty"><p>{ADDRESS}<br>{PHONE}</p></div>
    <div><h4>Body</h4><ul>{body}</ul></div>
    <div><h4>Skin</h4><ul>{skin}</ul></div>
    <div><h4>Clinic</h4><ul>
      <li><a href="{rel}results/index.html">Results</a></li><li><a href="{rel}about/index.html">About</a></li><li><a href="{rel}about/team.html">Meet the team</a></li><li><a href="{rel}price-list.html">Price list</a></li>
      <li><a href="{rel}shop/gift-vouchers.html">Gift vouchers</a></li><li><a href="{rel}book/index.html">Book a treatment</a></li><li><a href="{rel}book/online-consultation.html">Online consultation</a></li>
      <li><a href="{rel}contact.html">Contact</a></li><li><a href="{rel}blog/index.html">Blog</a></li></ul></div>
  </div>
  <div class="bottom"><span>© <span id="yr">2026</span> Balance Clinic · Spa · Beauty</span><span><a href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">4.9 ★ on Google</a></span></div>
  <div class="giant" aria-hidden="true">Balance</div>
</footer>
<a class="fab" id="fab" href="{rel}book/index.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Book</a>
<div id="lb" aria-hidden="true" role="dialog" aria-label="Media viewer" data-lenis-prevent>
  <div class="box"><video playsinline controls preload="none"></video><img alt="" hidden><button class="x" aria-label="Close video"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="t"></div></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
<script src="{rel}assets/js/site.js"></script>
</body>
</html>
'''

def page(rel, title, desc, current, body, show_intro=False):
    out = head(title, desc, rel)
    if show_intro: out += intro().replace("ASSETS/", rel + "assets/")
    out += pt()
    return out + header(rel, current) + body + footer(rel)

def phero(rel, crumbs, title_html, lead, img=None, word=None, ctas=""):
    if img:
        bg = f'<div class="bg"><img src="{rel}assets/img/{img}" alt=""></div>'
    else:
        bg = f'<div class="bg typo"><span>{word or ""}</span></div>'
    crumb = " ".join(f'<a href="{rel}{h}">{t}</a> <span>/</span>' for t, h in crumbs)
    here = re.sub(r"<[^>]+>", "", title_html)
    return f'''<section class="phero grain">
  {bg}
  <div class="content">
    <div class="crumbs">{crumb} <span>{here}</span></div>
    <h1 data-split>{title_html}</h1>
    <p class="lead" data-reveal>{lead}</p>
    {('<div class="ctas" data-reveal>' + ctas + '</div>') if ctas else ''}
  </div>
</section>
'''

def ba(rel, key, cap, idx):
    return f'''<div class="ba" data-reveal style="aspect-ratio:{RATIO[key]}">
  <img class="after" src="{rel}assets/img/{key}-after.jpg" alt="After: {html.escape(cap)}" loading="lazy">
  <img class="before" src="{rel}assets/img/{key}-before.jpg" alt="Before: {html.escape(cap)}" loading="lazy">
  <div class="scan"></div>
  <div class="grip"><svg viewBox="0 0 24 24"><path d="M8 6l-5 6 5 6"/></svg>Drag<svg viewBox="0 0 24 24"><path d="M16 6l5 6-5 6"/></svg></div>
  <span class="cap">{cap}</span>
  <button class="full" type="button" data-image="{rel}assets/img/{key}-full.jpg" data-title="{html.escape(cap)}" aria-label="View the full photo"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
  <input type="range" min="0" max="100" value="50" id="ba-{key}-{idx}" aria-label="Compare before and after: {html.escape(cap)}">
</div>'''

def reel(rel, src, poster, title, text):
    return f'''<div class="reel" data-reveal>
  <div class="phone" data-video="{rel}assets/video/{src}" data-poster="{rel}assets/img/{poster}" data-title="{html.escape(title)}" role="button" tabindex="0" aria-label="Play: {html.escape(title)}">
    <video muted loop playsinline preload="metadata" poster="{rel}assets/img/{poster}" src="{rel}assets/video/{src}" data-reel></video>
    <div class="ply"><span>{PLAY}</span><b>Watch</b></div>
  </div>
  <p><b>{title}</b>{text}</p>
</div>'''

def visit(rel, title_html="Trimgate Street,<br><em>Navan.</em>", lead="Walk in from the town centre, or book online and we will have your room ready. Gift vouchers are available for every treatment on the menu."):
    return f'''<section class="visit">
  <div class="card">
    <div>
      <p class="eyebrow">Visit us</p>
      <h2 data-split>{title_html}</h2>
      <p class="lead" data-reveal>{lead}</p>
      <div class="ctas" data-reveal><a class="btn btn-lime" href="{rel}book/index.html">Book online {ARROW}</a><a class="btn btn-ghost-light" href="{MAPS}" target="_blank" rel="noopener">Get directions</a></div>
    </div>
    <div class="details" data-reveal>
      <div><span>Address</span><div><strong>8 Trimgate Street, Townparks</strong><small>Navan, Co. Meath, C15 DHE9</small></div></div>
      <div><span>Phone</span><div><strong>{PHONE}</strong><button class="copy" type="button" data-copy="046 906 0333">Copy</button><small>Call for today's opening hours</small></div></div>
      <div><span>Hours</span><div><strong>Late opening until 8pm</strong><small>Evening appointments available</small></div></div>
      <div><span>Online</span><div><strong><a href="{rel}book/index.html">Book a treatment</a></strong><small>Or an online consultation</small></div></div>
    </div>
  </div>
</section>
'''

def tcard(rel, t):
    pic = f'<img src="{rel}assets/img/{t["img"]}" alt="" loading="lazy">' if t.get("img") else t["title"][0]
    new = ' <i style="font-style:normal;font-family:var(--sans);font-size:10px;letter-spacing:.2em;color:var(--coral);vertical-align:middle">NEW</i>' if t.get("new") else ""
    return f'''<a class="tcard" href="{rel}treatments/{t["slug"]}.html" data-reveal>
  <div class="pic">{pic}</div>
  <div><h3>{t["title"]}{new}</h3><p>{t["short"]}</p></div>
  <span class="arrow"><svg viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>
</a>'''

# ---------------------------------------------------------------- pages
def home():
    rel = ""
    cards = ""
    strip = [
        ("Medical Grade Laser", "Hair removal, rejuvenation and thread veins.", "laser.jpg", "treatments/laser-hair-removal.html", ["Hair removal", "Thread veins"]),
        ("Body Treatments", "Venus Legacy contouring, cellulite and skin tightening.", "contour.jpg", "treatments/body-contouring.html", ["Venus Legacy", "Cellulite"]),
        ("Skin Treatments", "Alumier peels, IPL, microneedling and exosomes.", "hero-poster.jpg", "treatments/alumier-md-peels.html", ["Peels", "IPL", "Needling"]),
        ("Non Surgical", "Microneedling, Idenel and CACI for lift without surgery.", "nonsurgical.jpg", "treatments/microneedling.html", ["Microneedling", "Idenel"]),
        ("Massage", "Swedish, deep tissue, hot stone, Indian head and pregnancy.", "massage.jpg", "treatments/massage.html", ["Hot stone", "Deep tissue"]),
        ("Beauty", "Nails, lashes, brows, tanning and waxing.", "beauty.jpg", "treatments/index.html#beauty", ["Lashes", "Brows", "Nails"]),
    ]
    for i, (t, d, img, href, tags) in enumerate(strip):
        cards += f'''<a class="hcard" href="{href}"><img src="assets/img/{img}" alt="" loading="lazy"><span class="n">0{i+1}</span><span class="arrow"><svg viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span><div><h3>{t}</h3><p>{d}</p><div class="tags">{"".join(f"<span>{x}</span>" for x in tags)}</div></div></a>'''
    cards += '''<a class="hcard cta" href="treatments/index.html"><div><h3>All 16 treatments</h3><p>Browse the full menu and book online.</p><div class="tags" style="justify-content:center"><span>View all</span></div></div></a>'''
    marquee = "".join(f"<span>{x}</span>" for x in ["Laser Hair Removal", "Microneedling", "Venus Legacy", "Lumenis M22 IPL", "Hot Stone Massage", "Alumier MD Peels", "Idenel Liquid Microneedling", "Lashes & Brows", "Gift Vouchers"] * 2)
    results = "".join(ba(rel, k, c, i) for i, (k, c, _) in enumerate(RESULTS))
    reels = "".join(reel(rel, *r) for r in REELS)
    body = f'''<section class="hero grain">
  <div class="bgv"><video autoplay muted loop playsinline preload="auto" poster="assets/img/hero-poster.jpg" src="assets/video/hero.mp4" aria-label="Inside the clinic: an Alumier peel being prepared"></video></div>
  <div class="content">
    <div>
      <p class="eyebrow">Navan, Co. Meath · Clinic, Spa &amp; Beauty</p>
      <h1><span class="line"><span class="inner">Find your</span></span><span class="line"><span class="inner"><em>balance.</em></span></span></h1>
    </div>
    <div class="side">
      <p data-reveal>Medical-grade laser, advanced skin treatments, body contouring, massage and beauty under one roof on Trimgate Street.</p>
      <div class="ctas" data-reveal><a class="btn btn-lime" href="book/index.html">Book a treatment {ARROW}</a><a class="btn btn-ghost-light" href="treatments/index.html">Explore treatments</a></div>
      <a class="rating" data-reveal href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener" aria-label="4.9 stars from over 800 Google reviews"><span class="g">G</span><span class="stars" aria-hidden="true">★★★★★</span><span><b>4.9</b> · 800+ Google reviews</span></a>
    </div>
  </div>
  <div class="cue" aria-hidden="true"><i></i>Scroll</div>
</section>

<div class="marquee" aria-hidden="true"><div class="track">{marquee}</div></div>

<section class="statement">
  <div class="inner">
    <p class="eyebrow" style="margin-bottom:34px">The Balance experience</p>
    <p class="big">Take a step into our world and find the balance between <em>rejuvenation</em> and <em>relaxation</em>. Signature treatments, expert hands and results you can see.</p>
    <div class="row" data-reveal><a class="link" href="about/index.html">Our story {ARROW}</a><a class="link" href="about/team.html">Meet the team {ARROW}</a></div>
  </div>
</section>

<section class="hstrip">
  <div class="pin">
    <div class="head"><div><p class="eyebrow">Treatments</p><h2 data-split>Everything your skin and body asks for.</h2></div><p data-reveal style="max-width:36ch;color:var(--ink-2)">Six specialisms, one expert team. Every treatment starts with a consultation so the plan fits you.</p></div>
    <div class="track">{cards}</div>
  </div>
</section>

<section class="sec dark" id="feature">
  <div class="split">
    <div class="img reveal-img"><img src="assets/img/contour.jpg" alt="Venus Legacy radio-frequency treatment on the thigh" loading="lazy"></div>
    <div>
      <p class="eyebrow">Signature · Venus Legacy</p>
      <h2 data-split>Contour, tighten, <em>smooth.</em></h2>
      <p class="lead" data-reveal>Multi-polar radio frequency and pulsed electromagnetic fields warm the deeper layers of skin, boost collagen and reduce the look of cellulite. No downtime, no needles.</p>
      <div class="list" data-reveal>
        <div><span>Facial skin tightening</span><span>Face &amp; neck</span></div>
        <div><span>Cellulite reduction</span><span>Thighs &amp; glutes</span></div>
        <div><span>Body contouring</span><span>Abdomen &amp; arms</span></div>
      </div>
      <div class="ctas" data-reveal><a class="btn btn-lime" href="treatments/body-contouring.html">Body contouring {ARROW}</a><a class="btn btn-ghost-light" href="treatments/what-is-cellulite.html">What is cellulite?</a></div>
    </div>
  </div>
  <div class="bigword" aria-hidden="true">Legacy</div>
</section>

<section class="sec" id="results">
  <div class="sec-head"><div><p class="eyebrow">Real results</p><h2 data-split>Drag the scan to see the difference.</h2></div><p data-reveal>Clients of Balance, photographed in clinic. Results vary from person to person, so we always start with a consultation.</p></div>
  <div class="ba-grid">{results}</div>
  <div style="display:flex;justify-content:center;margin-top:48px" data-reveal><a class="btn btn-moss" href="results/index.html">See all results {ARROW}</a></div>
</section>

<section class="sec sage" id="reels">
  <div class="sec-head"><div><p class="eyebrow">Inside the clinic</p><h2 data-split>See it in motion.</h2></div><p data-reveal>Short clips from the treatment rooms. Tap any one to watch it full size with sound.</p></div>
  <div class="reel-row">{reels}</div>
</section>

<section class="reviews" id="reviews">
  <div class="num">0.0</div>
  <div class="stars" aria-hidden="true">{"".join('<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 5.9 21l1.3-6.8-5-4.7 6.8-.8z"/></svg>' for _ in range(5))}</div>
  <h2>Rated by <b data-count>0</b> clients on Google</h2>
  <p class="sub">The highest-rated clinic of its kind in Meath, built review by review. Read what people say in their own words.</p>
  <div class="ctas"><a class="btn btn-moss" href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Read the reviews</a><a class="btn btn-ghost" href="book/index.html">Book now</a></div>
  <div class="pillars">
    <div class="pillar" data-reveal><div class="ic"><svg viewBox="0 0 48 48"><path d="M10 38C14 18 26 10 40 8c-2 14-10 26-30 30z"/><path d="M12 36c6-8 14-14 22-20"/></svg></div><h3>Relax</h3><p>Massage, warm towels and time that is only yours.</p></div>
    <div class="pillar" data-reveal><div class="ic"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="3.5"/><ellipse cx="24" cy="12" rx="4" ry="8"/><ellipse cx="24" cy="36" rx="4" ry="8"/><ellipse cx="12" cy="24" rx="8" ry="4"/><ellipse cx="36" cy="24" rx="8" ry="4"/></svg></div><h3>Rejuvenate</h3><p>Laser, peels and microneedling that work with your skin.</p></div>
    <div class="pillar" data-reveal><div class="ic"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="17" r="2.5"/><circle cx="24" cy="31" r="2.5"/></svg></div><h3>Rebalance</h3><p>A plan built around you, reviewed as your skin changes.</p></div>
    <div class="pillar" data-reveal><div class="ic"><svg viewBox="0 0 48 48"><path d="M24 4l4.5 11 11.5 1.5-8 8 2 11.5L24 30.5 14 36l2-11.5-8-8L19.5 15z"/><circle cx="24" cy="24" r="2"/></svg></div><h3>Retreat</h3><p>A calm room on a busy street, minutes from everything.</p></div>
  </div>
</section>
{visit(rel)}'''
    return page(rel, "Balance Clinic Spa Beauty, Navan", "Medical-grade laser, skin treatments, body contouring, massage and beauty in Navan, Co. Meath. Rated 4.9 by over 800 Google reviewers.", "home", body, show_intro=True)

def treatments_index():
    rel = "../"
    groups = ""
    for key, name, desc in GROUPS:
        cards = "".join(tcard(rel, t) for t in T if t["group"] == key)
        groups += f'''<section class="tgroup" id="{key}"><div class="inner"><div><h2 data-split><small>{name}</small>{name.split()[0]} <em style="font-style:italic;color:var(--moss)">{" ".join(name.split()[1:])}</em></h2><p class="tp" data-reveal>{desc}</p></div><div class="tlist">{cards}</div></div></section>'''
    body = phero(rel, [("Home", "index.html")], "Treatments", "Sixteen treatments across body, skin and beauty, each starting with a consultation.", img="nonsurgical.jpg",
                 ctas=f'<a class="btn btn-lime" href="{rel}book/index.html">Book a treatment {ARROW}</a><a class="btn btn-ghost-light" href="{rel}price-list.html">Price list</a>')
    body += groups + visit(rel)
    return page(rel, "Treatments · Balance Clinic", "Laser, skin, body and beauty treatments at Balance Clinic Spa Beauty, Navan.", "treatments", body)

def treatment_page(t):
    rel = "../"
    gname = dict((g[0], g[1]) for g in GROUPS)[t["group"]]
    title = t["title"].replace(t["em"], f'<em>{t["em"]}</em>', 1) if t["em"] in t["title"] else t["title"]
    prose = "".join(f"<p>{p}</p>" for p in t["body"])
    benefits = "".join(f"<li>{b}</li>" for b in t["benefits"])
    steps = "".join(f"<div><div><b>{a}</b>{b}</div></div>" for a, b in t["steps"])
    facts = "".join(f"<div><span>{a}</span><span>{b}</span></div>" for a, b in t["facts"])
    faqs = "".join(f"<details><summary>{q}<i></i></summary><div class=\"a\">{a}</div></details>" for q, a in t["faqs"])
    media = ""
    if t.get("video"):
        v, p, cap = t["video"]
        media = f'<div class="media" data-video="{rel}assets/video/{v}" data-poster="{rel}assets/img/{p}" data-title="{html.escape(cap)}" role="button" tabindex="0" aria-label="Play video: {html.escape(cap)}"><video muted loop playsinline preload="metadata" poster="{rel}assets/img/{p}" src="{rel}assets/video/{v}" data-reel></video><div class="ply"><span>{PLAY}</span></div></div>'
    elif t.get("compare"):
        cap = dict((k, c) for k, c, _ in RESULTS)[t["compare"]]
        media = ba(rel, t["compare"], cap, 0)
    related = [x for x in T if x["group"] == t["group"] and x["slug"] != t["slug"]][:3]
    if len(related) < 3: related += [x for x in T if x["group"] != t["group"]][:3 - len(related)]
    rel_cards = "".join(tcard(rel, x) for x in related)
    body = phero(rel, [("Home", "index.html"), ("Treatments", "treatments/index.html"), (gname, f"treatments/index.html#{t['group']}")], title, t["intro"], img=t.get("img"), word=t["em"],
                 ctas=f'<a class="btn btn-lime" href="{rel}book/index.html">Book {t["title"].lower() if len(t["title"]) < 20 else "now"} {ARROW}</a><a class="btn btn-ghost-light" href="{rel}book/online-consultation.html">Ask a question</a>')
    body += f'''<section class="tbody"><div class="inner">
  <div class="prose">
    <h2 data-split>About the treatment</h2>{prose}
    <h2 data-split>Good for</h2><ul data-reveal>{benefits}</ul>
    <h2 data-split>What to expect</h2><div class="steps" data-reveal>{steps}</div>
  </div>
  <aside class="aside">
    <div class="box" data-reveal><h3>Book {t["title"].lower() if len(t["title"]) < 26 else "this treatment"}</h3><p>Every course starts with a consultation. Book online or call {PHONE}.</p><a class="btn btn-lime" href="{rel}book/index.html">Book now {ARROW}</a></div>
    <div class="facts" data-reveal>{facts}</div>
    {media}
  </aside>
</div></section>
<section class="sec" style="padding-top:0"><div class="faq"><h2 data-split>Questions, answered.</h2><div data-reveal>{faqs}</div></div></section>
<section class="related"><div class="inner"><h2 data-split>You may also like</h2><div class="row">{rel_cards}</div></div></section>
{visit(rel)}'''
    return page(rel, f"{t['name']} · Balance Clinic", t["name"] + ". " + html.unescape(t["short"]), "treatments", body)

def results():
    rel = "../"
    cards = "".join(ba(rel, k, c, i) for i, (k, c, _) in enumerate(RESULTS))
    reels = "".join(reel(rel, *r) for r in REELS)
    body = phero(rel, [("Home", "index.html")], "Real <em>results.</em>", "Clients of Balance, photographed in clinic before and after treatment. Drag the scan line across each photo, or open the full picture.", img="rosacea-after.jpg",
                 ctas=f'<a class="btn btn-lime" href="{rel}book/index.html">Book a consultation {ARROW}</a><a class="btn btn-ghost-light" href="{rel}treatments/index.html">All treatments</a>')
    body += f'''<section class="sec"><div class="sec-head"><div><p class="eyebrow">Before &amp; after</p><h2 data-split>Drag the scan to compare.</h2></div><p data-reveal>Results vary from person to person. Every plan starts with a consultation so we can tell you what to expect.</p></div><div class="ba-grid wide">{cards}</div></section>
<section class="sec sage"><div class="sec-head"><div><p class="eyebrow">In motion</p><h2 data-split>From the treatment rooms.</h2></div><p data-reveal>Tap any clip to watch it full size with sound.</p></div><div class="reel-row">{reels}</div></section>
<section class="reviews"><div class="num">0.0</div><div class="stars" aria-hidden="true">{"".join('<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 5.9 21l1.3-6.8-5-4.7 6.8-.8z"/></svg>' for _ in range(5))}</div><h2>Rated by <b data-count>0</b> clients on Google</h2><p class="sub">Read what people say in their own words.</p><div class="ctas"><a class="btn btn-moss" href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Read the reviews</a></div></section>
{visit(rel)}'''
    return page(rel, "Results · Balance Clinic", "Before and after photos from Balance Clinic Spa Beauty, Navan.", "results", body)

def about():
    rel = "../"
    body = phero(rel, [("Home", "index.html")], "Clinic, spa and <em>beauty.</em>", "One address on Trimgate Street where medical-grade technology meets a spa that knows how to slow you down.", img="room.jpg")
    body += f'''<section class="statement"><div class="inner"><p class="eyebrow" style="margin-bottom:34px">Our story</p><p class="big">Balance started with a simple idea: treatments that <em>work</em>, delivered by people who <em>care</em>, in a room you never want to leave.</p></div></section>
<section class="sec dark"><div class="sec-head"><div><p class="eyebrow">What we stand for</p><h2 data-split>Three promises.</h2></div></div>
  <div class="values">
    <div class="value" data-reveal><b>01</b><h3>Honest advice</h3><p>If a treatment will not help you, we say so. Every plan starts with a consultation and a conversation.</p></div>
    <div class="value" data-reveal><b>02</b><h3>Medical grade</h3><p>Lumenis Stellar M22, Venus Legacy, Alumier MD and Dermalogica professional. Technology chosen for results, not trends.</p></div>
    <div class="value" data-reveal><b>03</b><h3>Time to breathe</h3><p>Warm towels, quiet rooms and therapists who never rush. The spa side of Balance is not an afterthought.</p></div>
  </div>
  <div class="bigword" aria-hidden="true">Balance</div>
</section>
<section class="sec"><div class="split">
  <div><p class="eyebrow">By the numbers</p><h2 data-split>Rated <em>4.9</em> by more than 800 people.</h2><p class="lead" data-reveal>We are the highest-rated clinic of our kind in Meath, and every review was written by a client who sat in one of our rooms.</p><div class="ctas" data-reveal><a class="btn btn-moss" href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Read the reviews</a><a class="btn btn-ghost" href="{rel}about/team.html">Meet the team {ARROW}</a></div></div>
  <div class="img reveal-img" style="aspect-ratio:4/3"><img src="{rel}assets/img/room.jpg" alt="A treatment room at Balance" loading="lazy"></div>
</div></section>
{visit(rel)}'''
    return page(rel, "About · Balance Clinic", "The story of Balance Clinic Spa Beauty in Navan.", "about", body)

def team():
    rel = "../"
    members = [("Clinic Director", "Leads the clinic and consults on advanced skin and laser treatments."), ("Senior Skin Therapist", "Alumier MD, Dermalogica, microneedling and IPL."), ("Laser Specialist", "Medical-grade laser hair removal and thread vein removal."), ("Massage Therapist", "Swedish, deep tissue, hot stone and pregnancy massage."), ("Beauty Therapist", "Lashes, brows, nails and waxing."), ("Body Specialist", "Venus Legacy contouring and skin tightening."), ("Front of House", "The first voice you hear and the person who finds you the right slot."), ("Online Consultations", "Answers your questions before you visit.")]
    cards = "".join(f'<div class="member" data-reveal><div class="pic">{r.split()[0][0]}</div><div class="txt"><h3>{r}</h3><p>{d}</p></div></div>' for r, d in members)
    body = phero(rel, [("Home", "index.html"), ("About", "about/index.html")], "Meet the <em>team.</em>", "Trained, certified and genuinely kind. The people who make Balance what it is.", word="Team")
    body += f'<section class="sec"><div class="sec-head"><div><p class="eyebrow">Our people</p><h2 data-split>Expert hands.</h2></div><p data-reveal>Every therapist is certified on the technology they use and keeps training as it moves on.</p></div><div class="team">{cards}</div></section>{visit(rel)}'
    return page(rel, "Meet the Team · Balance Clinic", "The therapists and specialists at Balance Clinic Spa Beauty, Navan.", "about", body)

def price_list():
    rel = ""
    groups = "".join(f'<div class="pgroup" data-reveal><h2>{g}</h2><table>' + "".join(f'<tr><td>{n}{"<small>"+s+"</small>" if s else ""}</td><td>On request</td></tr>' for n, s in rows) + "</table></div>" for g, rows in PRICES)
    body = phero(rel, [("Home", "index.html")], "Price <em>list.</em>", "Our full treatment menu. Courses are priced with a saving, and every treatment can be bought as a gift voucher.", word="Prices",
                 ctas=f'<a class="btn btn-lime" href="book/index.html">Book a treatment {ARROW}</a><a class="btn btn-ghost-light" href="shop/gift-vouchers.html">Gift vouchers</a>')
    body += f'<section class="sec"><div class="prices">{groups}</div><div class="pnote">Prices are confirmed at booking and at consultation. Call {PHONE} for a quote on a course or a package.</div></section>{visit(rel)}'
    return page(rel, "Price List · Balance Clinic", "Treatment prices at Balance Clinic Spa Beauty, Navan.", "prices", body)

def shop():
    rel = "../"
    body = phero(rel, [("Home", "index.html")], "The <em>shop.</em>", "Gift vouchers, seasonal offers and the professional skincare we use in clinic.", word="Shop")
    body += f'''<section class="sec"><div class="shop-grid">
  <a class="voucher" href="{rel}shop/gift-vouchers.html" data-reveal><div><b>Gift vouchers</b><p>Any amount, any treatment. Posted or emailed the same day.</p></div><span class="link">Buy a voucher {ARROW}</span></a>
  <a class="voucher alt" href="{rel}shop/january-sale.html" data-reveal><div><b>January sale</b><p>Our biggest savings of the year on courses and packages.</p></div><span class="link">See the offers {ARROW}</span></a>
  <a class="voucher blush" href="https://balanceclinic.ie/" target="_blank" rel="noopener" data-reveal><div><b>Skincare</b><p>Alumier MD, Dermalogica and Elemis, available from the clinic.</p></div><span class="link">Shop skincare {ARROW}</span></a>
</div></section>{visit(rel)}'''
    return page(rel, "Shop · Balance Clinic", "Gift vouchers, offers and skincare from Balance Clinic Spa Beauty.", "shop", body)

def gift_vouchers():
    rel = "../"
    body = phero(rel, [("Home", "index.html"), ("Shop", "shop/index.html")], "Gift <em>vouchers.</em>", "The present that is never the wrong size. Choose an amount or a specific treatment and we will do the rest.", word="Gift")
    body += f'''<section class="sec"><div class="split">
  <div><p class="eyebrow">How it works</p><h2 data-split>Give someone an hour that is only theirs.</h2><p class="lead" data-reveal>Vouchers can be for any value or any treatment on the menu, from a massage to a course of laser. We post them in a gift wallet or email them within the hour.</p>
    <div class="steps" data-reveal><div><div><b>Choose</b>An amount, or a treatment from the price list.</div></div><div><div><b>Order</b>Call {PHONE}, drop into the clinic or order online.</div></div><div><div><b>Deliver</b>Posted, emailed or collected, ready to give.</div></div></div>
    <div class="ctas" data-reveal><a class="btn btn-lime" href="https://balanceclinic.ie/" target="_blank" rel="noopener">Order online {ARROW}</a><a class="btn btn-ghost" href="{rel}contact.html">Ask us</a></div></div>
  <div class="shop-grid" style="grid-template-columns:1fr;max-width:420px">
    <div class="voucher" data-reveal><div><b>Any amount</b><p>From a treat to a full course.</p></div></div>
    <div class="voucher alt" data-reveal><div><b>A treatment</b><p>Massage, facial, laser, lashes. You name it.</p></div></div>
  </div>
</div></section>{visit(rel)}'''
    return page(rel, "Gift Vouchers · Balance Clinic", "Gift vouchers for any treatment at Balance Clinic Spa Beauty, Navan.", "shop", body)

def january_sale():
    rel = "../"
    body = phero(rel, [("Home", "index.html"), ("Shop", "shop/index.html")], "January <em>sale.</em>", "Every January we take our biggest savings of the year off courses and packages. Start the year with skin you are glad to see.", word="Sale")
    body += f'''<section class="sec"><div class="sale"><div><p class="eyebrow" style="color:var(--moss)">Limited time</p><h2 data-split>Courses, packages, savings.</h2><p class="lead" data-reveal style="color:var(--moss)">Laser courses, Venus Legacy packages, peel and microneedling courses and massage bundles. Offers run for the month of January, or while appointments last.</p><div class="ctas" data-reveal style="margin-top:28px"><a class="btn btn-moss" href="{rel}book/index.html">Book a sale treatment {ARROW}</a><a class="btn btn-white" href="{rel}contact.html">Ask about an offer</a></div></div><div class="big" aria-hidden="true">Jan</div></div></section>{visit(rel)}'''
    return page(rel, "January Sale · Balance Clinic", "January offers on courses and packages at Balance Clinic Spa Beauty.", "shop", body)

def form(rel, kind):
    opts = "".join(f'<option>{t["title"]}</option>' for t in T)
    typ = '<option value="treatment">Book a treatment</option><option value="consultation">Online consultation</option>' if kind == "book" else ""
    return f'''<form class="form" id="bookform" data-form method="post" action="https://api.web3forms.com/submit" novalidate>
  <input type="hidden" name="access_key" value="{WEB3FORMS_KEY}"><input type="hidden" name="subject" value="Balance Clinic website: {('booking request' if kind=='book' else 'message')}">
  <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off">
  {('<label>I would like to<select id="type" name="type">' + typ + '</select></label>') if typ else ''}
  <div class="row"><label>Name<input type="text" name="name" id="f-name" required autocomplete="name"></label><label>Phone<input type="tel" name="phone" id="f-phone" required autocomplete="tel"></label></div>
  <label>Email<input type="email" name="email" id="f-email" required autocomplete="email"></label>
  {('<div class="row"><label>Treatment<select name="treatment" id="f-treatment"><option>Not sure yet</option>' + opts + '</select></label><label>Preferred day and time<input type="text" name="preferred" id="f-pref" placeholder="e.g. Thursday evening"></label></div>') if kind=='book' else ''}
  <label>Message<textarea name="message" id="f-msg" placeholder="{'Anything we should know, or questions about the treatment.' if kind=='book' else 'How can we help?'}"></textarea></label>
  <div class="msg" hidden></div>
  <button class="btn btn-moss" type="submit">{'Send booking request' if kind=='book' else 'Send message'} {ARROW}</button>
  <p class="note">We confirm every request by phone or email. Or call {PHONE}.</p>
</form>'''

def book():
    rel = "../"
    body = phero(rel, [("Home", "index.html")], "Book a <em>treatment.</em>", "Tell us what you would like and when. We will confirm the slot and anything you need to know beforehand.", word="Book")
    body += f'''<section class="sec" style="padding-top:clamp(50px,6vw,80px)">
  <div class="book-opts">
    <div class="opt on" data-type="treatment" data-reveal><span class="k">Option 01</span><h3>Book a treatment</h3><p>Choose from the menu and tell us a day that suits. Perfect if you already know what you want.</p></div>
    <a class="opt" href="{rel}book/online-consultation.html" data-reveal><span class="k">Option 02</span><h3>Book an online consultation</h3><p>Not sure where to start? A short video call with a therapist to plan your treatment.</p></a>
  </div>
  <div class="split" style="align-items:start"><div>{form(rel, "book")}</div>
  <aside class="aside"><div class="box" data-reveal><h3>Prefer to talk?</h3><p>Call the clinic on {PHONE}. Late opening until 8pm.</p><button class="btn btn-lime copy" type="button" data-copy="046 906 0333" style="margin:0">Copy number</button></div><div class="facts" data-reveal><div><span>Address</span><span>8 Trimgate St, Navan</span></div><div><span>Hours</span><span>Late opening until 8pm</span></div><div><span>Consult</span><span>Included with every course</span></div><div><span>Vouchers</span><span>Accepted on all treatments</span></div></div></aside></div>
</section>{visit(rel)}'''
    return page(rel, "Book a Treatment · Balance Clinic", "Book a treatment at Balance Clinic Spa Beauty, Navan.", "book", body)

def consultation():
    rel = "../"
    body = phero(rel, [("Home", "index.html"), ("Book", "book/index.html")], "Online <em>consultation.</em>", "A short video call with a therapist to look at your skin, answer questions and plan the right treatment before you visit.", word="Consult")
    body += f'''<section class="sec" style="padding-top:clamp(50px,6vw,80px)"><div class="split" style="align-items:start">
  <div><p class="eyebrow">How it works</p><h2 data-split>Fifteen minutes, properly spent.</h2>
    <div class="steps" data-reveal style="margin-top:28px"><div><div><b>Request a time</b>Use the form and tell us what you would like to discuss.</div></div><div><div><b>We send a link</b>You will get a video-call link for the agreed time.</div></div><div><div><b>Plan together</b>A therapist recommends a treatment or a course, with prices.</div></div></div>
    <div style="margin-top:36px">{form(rel, "consult")}</div></div>
  <aside class="aside"><div class="box" data-reveal><h3>Good for</h3><p>Skin concerns, laser suitability, body contouring plans, or simply choosing between two treatments.</p><a class="btn btn-lime" href="{rel}treatments/index.html">Browse treatments {ARROW}</a></div><div class="facts" data-reveal><div><span>Length</span><span>About 15 min</span></div><div><span>Format</span><span>Video call</span></div><div><span>Cost</span><span>Ask when booking</span></div></div></aside>
</div></section>{visit(rel)}'''
    return page(rel, "Online Consultation · Balance Clinic", "Book an online consultation with Balance Clinic Spa Beauty.", "book", body)

def contact():
    rel = ""
    body = phero(rel, [("Home", "index.html")], "Say <em>hello.</em>", "Questions, bookings, vouchers or directions. Call, message or drop in.", word="Hello")
    body += f'''<section class="sec" style="padding-top:clamp(50px,6vw,80px)"><div class="split" style="align-items:start">
  <div>{form(rel, "contact")}</div>
  <div class="details" data-reveal style="color:var(--ink)">
    <div style="border-color:var(--line)"><span style="color:var(--moss)">Address</span><div><strong>8 Trimgate Street, Townparks</strong><small style="color:var(--ink-2)">Navan, Co. Meath, C15 DHE9</small></div></div>
    <div style="border-color:var(--line)"><span style="color:var(--moss)">Phone</span><div><strong>{PHONE}</strong><button class="copy" type="button" data-copy="046 906 0333" style="color:var(--moss);border-color:var(--line)">Copy</button><small style="color:var(--ink-2)">Call for today's opening hours</small></div></div>
    <div style="border-color:var(--line)"><span style="color:var(--moss)">Hours</span><div><strong>Late opening until 8pm</strong><small style="color:var(--ink-2)">Evening appointments available</small></div></div>
    <div style="border-color:var(--line)"><span style="color:var(--moss)">Find us</span><div><strong><a href="{MAPS}" target="_blank" rel="noopener" style="border-color:var(--line)">Open in Google Maps</a></strong><small style="color:var(--ink-2)">Town centre, minutes from parking</small></div></div>
  </div>
</div></section>{visit(rel)}'''
    return page(rel, "Contact · Balance Clinic", "Contact Balance Clinic Spa Beauty, 8 Trimgate Street, Navan.", "contact", body)

def blog_index():
    rel = "../"
    cards = "".join(f'''<a class="post" href="{rel}blog/{p["slug"]}.html" data-reveal><div class="pic"><img src="{rel}assets/img/{p["img"]}" alt="" loading="lazy">{'<span class="vid">Video</span>' if p.get("video") else ''}</div><div class="txt"><span class="meta">{p["date"]}</span><h3>{p["title"]}</h3><p>{p["summary"]}</p></div></a>''' for p in POSTS)
    body = phero(rel, [("Home", "index.html")], "The <em>journal.</em>", "Skin science, treatment explainers and what is new in the clinic.", word="Blog")
    body += f'<section class="sec"><div class="posts">{cards}</div></section>{visit(rel)}'
    return page(rel, "Blog · Balance Clinic", "Skin and treatment articles from Balance Clinic Spa Beauty.", "blog", body)

def post_page(p):
    rel = "../"
    media = ""
    if p.get("video"):
        v, po = p["video"]
        media = f'<div class="vidbox" data-video="{rel}assets/video/{v}" data-poster="{rel}assets/img/{po}" data-title="{html.escape(p["title"])}" role="button" tabindex="0" aria-label="Play video"><video muted loop playsinline preload="metadata" poster="{rel}assets/img/{po}" src="{rel}assets/video/{v}" data-reel></video><div class="ply"><span>{PLAY}</span></div></div>'
    if p.get("compare"):
        cap = dict((k, c) for k, c, _ in RESULTS)[p["compare"]]
        media += ba(rel, p["compare"], cap, 9)
    body = phero(rel, [("Home", "index.html"), ("Blog", "blog/index.html")], p["title"], p["summary"], img=p["img"])
    body += f'<section class="article"><div class="inner"><p class="eyebrow">{p["date"]}</p>{media}{"".join(p["body"])}</div></section>{visit(rel)}'
    return page(rel, f"{p['title']} · Balance Clinic", p["summary"], "blog", body)

# ---------------------------------------------------------------- write
def write(path, content):
    full = os.path.join(ROOT, path); os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f: f.write(content)

FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1C3A2A"/><path d="M32 16v32M16 32h32" stroke="#8DC34B" stroke-width="4" stroke-linecap="round"/></svg>'

if __name__ == "__main__":
    write("assets/img/favicon.svg", FAVICON)
    write("index.html", home())
    write("treatments/index.html", treatments_index())
    for t in T: write(f"treatments/{t['slug']}.html", treatment_page(t))
    write("results/index.html", results())
    write("about/index.html", about()); write("about/team.html", team())
    write("price-list.html", price_list())
    write("shop/index.html", shop()); write("shop/gift-vouchers.html", gift_vouchers()); write("shop/january-sale.html", january_sale())
    write("book/index.html", book()); write("book/online-consultation.html", consultation())
    write("contact.html", contact())
    write("blog/index.html", blog_index())
    for p in POSTS: write(f"blog/{p['slug']}.html", post_page(p))
    write("vercel.json", '{\n  "cleanUrls": true,\n  "trailingSlash": false\n}\n')
    print("built", 1 + 1 + len(T) + 2 + 1 + 3 + 2 + 1 + 1 + len(POSTS), "pages")
