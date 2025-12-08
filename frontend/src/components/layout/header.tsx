import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Athlete, Activity } from '@/lib/definitions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  athlete?: Athlete | null;
  activity?: Activity | null;
}

const Header: React.FC<HeaderProps> = ({ athlete, activity }) => {
  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-8 overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Betta"
                width={56}
                height={32}
                className="w-14 h-8 object-contain object-center"
              />
            </div>
          </Link>

          {/* Navigation Bar */}
          {athlete && (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-4">
                {/* Training Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Training ▼
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/athlete/${athlete.athlete_id}/plan-activity`}
                      >
                        Plan Activity
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/athlete/${athlete.athlete_id}/activity/new`}
                      >
                        Upload Activity
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/athlete/${athlete.athlete_id}/activities`}>
                        Activity Log
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/athlete/${athlete.athlete_id}/calendar`}>
                        Calendar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/athlete/${athlete.athlete_id}/goals`}>
                        Goals
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/athlete/${athlete.athlete_id}/performance`}>
                        Performance
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Activity Dropdown - only if activity is provided */}
                {activity && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-48">
                      {activity.name} ▼
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/activity/${activity.activity_id}/overview`}
                        >
                          Overview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/activity/${activity.activity_id}/laps`}>
                          Laps
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/activity/${activity.activity_id}/best_efforts`}
                        >
                          Best Efforts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/activity/${activity.activity_id}/zones`}>
                          Zones
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/activity/${activity.activity_id}/power`}>
                          Power
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground">
                      <Menu className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <nav className="flex flex-col gap-4 mt-6">
                      {/* Training Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                          Training
                        </h3>
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/athlete/${athlete.athlete_id}/plan-activity`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Plan Activity
                          </Link>
                          <Link
                            href={`/athlete/${athlete.athlete_id}/activity/new`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Upload Activity
                          </Link>
                          <Link
                            href={`/athlete/${athlete.athlete_id}/activities`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Activity Log
                          </Link>
                          <Link
                            href={`/athlete/${athlete.athlete_id}/calendar`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Calendar
                          </Link>
                          <Link
                            href={`/athlete/${athlete.athlete_id}/goals`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Goals
                          </Link>
                          <Link
                            href={`/athlete/${athlete.athlete_id}/performance`}
                            className="text-sm text-card-foreground hover:text-accent-foreground"
                          >
                            Performance
                          </Link>
                        </div>
                      </div>

                      {/* Activity Section - only if activity is provided */}
                      {activity && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 truncate">
                            {activity.name}
                          </h3>
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/activity/${activity.activity_id}/overview`}
                              className="text-sm text-card-foreground hover:text-accent-foreground"
                            >
                              Overview
                            </Link>
                            <Link
                              href={`/activity/${activity.activity_id}/laps`}
                              className="text-sm text-card-foreground hover:text-accent-foreground"
                            >
                              Laps
                            </Link>
                            <Link
                              href={`/activity/${activity.activity_id}/best_efforts`}
                              className="text-sm text-card-foreground hover:text-accent-foreground"
                            >
                              Best Efforts
                            </Link>
                            <Link
                              href={`/activity/${activity.activity_id}/zones`}
                              className="text-sm text-card-foreground hover:text-accent-foreground"
                            >
                              Zones
                            </Link>
                            <Link
                              href={`/activity/${activity.activity_id}/power`}
                              className="text-sm text-card-foreground hover:text-accent-foreground"
                            >
                              Power
                            </Link>
                          </div>
                        </div>
                      )}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
        {athlete && (
          <div className="flex items-center gap-3">
            <Link
              href={`/athlete/${athlete.athlete_id}/profile`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {athlete.first_name} {athlete.last_name}
            </Link>

            {/* Avatar with Context Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors">
                    {athlete.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`http://localhost:8000${athlete.profile_picture_url}`}
                        alt={`${athlete.first_name} ${athlete.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {athlete.first_name?.[0]}
                        {athlete.last_name?.[0]}
                      </span>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/athlete/${athlete.athlete_id}/equipment`}>
                    Equipment
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/athlete/${athlete.athlete_id}/settings`}>
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
